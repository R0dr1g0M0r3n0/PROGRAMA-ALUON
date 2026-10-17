package com.aluon.crm.quote.service;

import com.aluon.crm.customer.model.Customer;
import com.aluon.crm.customer.model.DeliveryAddress;
import com.aluon.crm.customer.repository.CustomerRepository;
import com.aluon.crm.catalog.service.CatalogDoorPricingResult;
import com.aluon.crm.catalog.service.CatalogDoorPricingService;
import com.aluon.crm.customer.model.CustomerTariff;
import com.aluon.production.cutlist.model.DoorModel;
import com.aluon.production.cutlist.model.DoorType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import com.aluon.crm.quote.model.QuoteChannel;
import com.aluon.crm.quote.dto.QuoteCreateRequest;
import com.aluon.crm.quote.model.QuoteItem;
import com.aluon.crm.quote.dto.QuoteItemRequest;
import com.aluon.crm.quote.dto.QuoteItemResponse;
import com.aluon.crm.quote.dto.QuoteRequest;
import com.aluon.crm.quote.repository.QuoteRequestRepository;
import com.aluon.crm.quote.dto.QuoteResponse;
import com.aluon.crm.quote.dto.QuoteLifecycleNumbersResponse;
import com.aluon.crm.quote.dto.QuoteSendRequest;
import com.aluon.crm.quote.dto.QuoteUpdateRequest;
import com.aluon.crm.quote.model.QuoteStatus;
import com.aluon.crm.quote.model.QuoteValidationMode;
import com.aluon.crm.documents.model.DocumentPrefix;
import com.aluon.crm.documents.model.DocumentSeries;
import com.aluon.crm.documents.model.QuoteSeriesResolver;
import com.aluon.crm.documents.service.DocumentNumberService;
import com.aluon.production.order.dto.WorkOrderRequestResponseDto;
import com.aluon.production.order.service.OrderService;
import com.aluon.production.order.repository.OrderRepository;


@Service
@RequiredArgsConstructor
public class QuoteService {

    private final QuoteRequestRepository quoteRequestRepository;
    private final CustomerRepository customerRepository;
    private final CatalogDoorPricingService catalogDoorPricingService;
    private final DocumentNumberService documentNumberService;
    private final OrderService orderService;
    private final OrderRepository orderRepository;

    @Transactional
    public QuoteResponse create(QuoteCreateRequest request) {
        validateCreate(request);

        UUID customerId = Objects.requireNonNull(request.getCustomerId(), "customerId");
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));

        CustomerTariff customerTariff = CustomerTariff.fromRaw(customer.getTarifa());

        QuoteValidationMode validationMode = customer.isAutoApproveQuotes() ? QuoteValidationMode.AUTO : QuoteValidationMode.MANUAL;
        QuoteChannel channel = request.getChannel() == null ? QuoteChannel.BOTH : request.getChannel();

        DocumentSeries series = documentNumberService.nextSeries();

        QuoteRequest quote = QuoteRequest.builder()
                .quoteNumber(series.format(DocumentPrefix.PTO))
                .seriesDate(series.date())
                .seriesSequence(series.sequence())
                .customer(customer)
                .tariffCode(customerTariff.code())
                .contactEmail(customer.getEmail())
                .contactWhatsapp(customer.getTelefono())
                .status(validationMode == QuoteValidationMode.AUTO ? QuoteStatus.ENVIADO : QuoteStatus.PENDIENTE_VALIDACION)
                .validationMode(validationMode)
                .channel(channel)
                .createdAt(LocalDateTime.now())
                .build();

        List<QuoteItem> items = request.getItems().stream()
                .map(item -> toQuoteItem(quote, customerTariff, item))
                .toList();

        BigDecimal total = items.stream()
                .map(QuoteItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        quote.setItems(items);
        quote.setTotal(total);

        if (validationMode == QuoteValidationMode.AUTO) {
            LocalDateTime now = LocalDateTime.now();
            quote.setValidatedAt(now);
            quote.setSentAt(now);
        }

        QuoteRequest saved = quoteRequestRepository.save(quote);
        return toResponse(Objects.requireNonNull(saved, "saved"));
    }

    @Transactional
    public QuoteResponse validate(UUID id) {
        UUID quoteId = Objects.requireNonNull(id, "id");
        QuoteRequest quote = Objects.requireNonNull(quoteRequestRepository.findById(quoteId)
                .orElseThrow(() -> new IllegalArgumentException("Presupuesto no encontrado")), "quote");

        if (quote.getStatus() == QuoteStatus.ENVIADO) {
            return toResponse(quote);
        }

        quote.setStatus(QuoteStatus.VALIDADO);
        quote.setValidatedAt(LocalDateTime.now());
        return toResponse(Objects.requireNonNull(quoteRequestRepository.save(quote), "quote"));
    }

    @Transactional
    public WorkOrderRequestResponseDto convertToOrder(UUID id) {
        QuoteRequest quote = quoteRequestRepository.findById(Objects.requireNonNull(id, "id"))
                .orElseThrow(() -> new IllegalArgumentException("Presupuesto no encontrado"));
        if (quote.getStatus() != QuoteStatus.VALIDADO && quote.getStatus() != QuoteStatus.ENVIADO) {
            throw new IllegalArgumentException("El presupuesto debe estar validado antes de crear una orden");
        }
        if (quote.getConvertedOrderId() != null) {
            return orderRepository.findById(quote.getConvertedOrderId())
                    .map(order -> WorkOrderRequestResponseDto.builder()
                            .id(order.getId())
                            .codigoOrden(order.getCodigoOrden())
                            .build())
                    .orElseThrow(() -> new IllegalStateException("La orden vinculada al presupuesto no existe"));
        }
        String sourceNote = "Generada desde presupuesto " + quote.getQuoteNumber();
        WorkOrderRequestResponseDto legacyOrder = orderRepository.findFirstByNotesOrderByCreatedAtAsc(sourceNote)
                .map(order -> WorkOrderRequestResponseDto.builder()
                        .id(order.getId())
                        .codigoOrden(order.getCodigoOrden())
                        .build())
                .orElse(null);
        if (legacyOrder != null) {
            quote.setConvertedOrderId(legacyOrder.getId());
            quoteRequestRepository.save(quote);
            return legacyOrder;
        }
        QuoteItem item = quote.getItems().stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("El presupuesto no tiene líneas"));
        WorkOrderRequestResponseDto created = orderService.createFromQuote(quote.getCustomer(), quote.getQuoteNumber(), item);
        quote.setConvertedOrderId(created.getId());
        quoteRequestRepository.save(quote);
        return created;
    }

    @Transactional
    public QuoteResponse send(UUID id, QuoteSendRequest request) {
        UUID quoteId = Objects.requireNonNull(id, "id");
        QuoteRequest quote = Objects.requireNonNull(quoteRequestRepository.findById(quoteId)
                .orElseThrow(() -> new IllegalArgumentException("Presupuesto no encontrado")), "quote");

        QuoteChannel channel = request != null && request.getChannel() != null ? request.getChannel() : quote.getChannel();
        quote.setChannel(channel);

        if (quote.getStatus() == QuoteStatus.PENDIENTE_VALIDACION) {
            // Mobile flow: el cliente "envía" la solicitud, pero el SaaS la valida posteriormente.
            // No marcamos como ENVIADO para no saltarnos el proceso de validación.
            if (quote.getSentAt() == null) {
                quote.setSentAt(LocalDateTime.now());
            }
            return toResponse(Objects.requireNonNull(quoteRequestRepository.save(quote), "quote"));
        }

        if (quote.getStatus() != QuoteStatus.VALIDADO && quote.getStatus() != QuoteStatus.ENVIADO) {
            throw new IllegalArgumentException("El presupuesto debe estar validado antes de enviar");
        }

        quote.setStatus(QuoteStatus.ENVIADO);
        quote.setSentAt(LocalDateTime.now());
        return toResponse(Objects.requireNonNull(quoteRequestRepository.save(quote), "quote"));
    }

    @Transactional
    public QuoteResponse update(UUID id, QuoteUpdateRequest request) {
        UUID quoteId = Objects.requireNonNull(id, "id");
        QuoteUpdateRequest safeRequest = Objects.requireNonNull(request, "request");

        QuoteRequest quote = Objects.requireNonNull(quoteRequestRepository.findById(quoteId)
                .orElseThrow(() -> new IllegalArgumentException("Presupuesto no encontrado")), "quote");

        Customer customer = Objects.requireNonNull(quote.getCustomer(), "customer");

        if (safeRequest.getCustomerNombreComercial() != null) customer.setNombreComercial(safeRequest.getCustomerNombreComercial());
        if (safeRequest.getCustomerTelefono() != null) customer.setTelefono(safeRequest.getCustomerTelefono());
        if (safeRequest.getCustomerDireccion() != null) customer.setDireccion(safeRequest.getCustomerDireccion());
        if (safeRequest.getCustomerCp() != null) customer.setCp(safeRequest.getCustomerCp());
        if (safeRequest.getCustomerPoblacion() != null) customer.setPoblacion(safeRequest.getCustomerPoblacion());
        if (safeRequest.getCustomerProvincia() != null) customer.setProvincia(safeRequest.getCustomerProvincia());

        boolean touchesDelivery =
                safeRequest.getDeliveryDireccionEntrega() != null
                        || safeRequest.getDeliveryCp() != null
                        || safeRequest.getDeliveryPoblacion() != null
                        || safeRequest.getDeliveryProvincia() != null;

        if (touchesDelivery) {
            DeliveryAddress delivery = null;
            if (customer.getDireccionesEntrega() != null && !customer.getDireccionesEntrega().isEmpty()) {
                delivery = customer.getDireccionesEntrega().get(0);
            }
            if (delivery == null) {
                delivery = DeliveryAddress.builder()
                        .nombreAlias("Principal")
                        .build();
                customer.addDireccion(delivery);
            }

            if (safeRequest.getDeliveryDireccionEntrega() != null) delivery.setDireccion(safeRequest.getDeliveryDireccionEntrega());
            if (safeRequest.getDeliveryCp() != null) delivery.setCp(safeRequest.getDeliveryCp());
            if (safeRequest.getDeliveryPoblacion() != null) delivery.setPoblacion(safeRequest.getDeliveryPoblacion());
            if (safeRequest.getDeliveryProvincia() != null) delivery.setProvincia(safeRequest.getDeliveryProvincia());
        }

        if (safeRequest.getContactEmail() != null) quote.setContactEmail(safeRequest.getContactEmail());
        if (safeRequest.getContactWhatsapp() != null) quote.setContactWhatsapp(safeRequest.getContactWhatsapp());

        customerRepository.save(customer);
        QuoteRequest saved = quoteRequestRepository.save(quote);
        return toResponse(Objects.requireNonNull(saved, "saved"));
    }

    @Transactional
    public QuoteResponse duplicate(UUID id) {
        QuoteRequest source = quoteRequestRepository.findById(Objects.requireNonNull(id, "id"))
                .orElseThrow(() -> new IllegalArgumentException("Presupuesto no encontrado"));
        DocumentSeries series = documentNumberService.nextSeries();
        QuoteRequest copy = QuoteRequest.builder()
                .quoteNumber(series.format(DocumentPrefix.PTO))
                .seriesDate(series.date())
                .seriesSequence(series.sequence())
                .customer(source.getCustomer())
                .tariffCode(source.getTariffCode())
                .contactEmail(source.getContactEmail())
                .contactWhatsapp(source.getContactWhatsapp())
                .status(QuoteStatus.PENDIENTE_VALIDACION)
                .validationMode(QuoteValidationMode.MANUAL)
                .channel(source.getChannel())
                .total(source.getTotal())
                .createdAt(LocalDateTime.now())
                .parentQuoteId(source.getParentQuoteId() == null ? source.getId() : source.getParentQuoteId())
                .revision(source.getRevision() == null ? 2 : source.getRevision() + 1)
                .build();
        List<QuoteItem> copiedItems = source.getItems().stream().map(item -> QuoteItem.builder()
                .quoteRequest(copy)
                .doorModel(item.getDoorModel()).doorType(item.getDoorType()).productCategory(item.getProductCategory())
                .colorCode(item.getColorCode()).primerRequired(item.getPrimerRequired()).openingVariant(item.getOpeningVariant())
                .widthMm(item.getWidthMm()).heightMm(item.getHeightMm()).floorClearanceMm(item.getFloorClearanceMm())
                .larguero(item.getLarguero()).marcoSuperior(item.getMarcoSuperior()).bisagras(item.getBisagras())
                .porteroAutomatico(item.getPorteroAutomatico()).unidades(item.getUnidades()).m2(item.getM2())
                .pricePerM2(item.getPricePerM2()).lineTotal(item.getLineTotal()).build()).toList();
        copy.setItems(new java.util.ArrayList<>(copiedItems));
        return toResponse(quoteRequestRepository.save(copy));
    }

    @Transactional(readOnly = true)
    public QuoteResponse getById(UUID id) {
        UUID quoteId = Objects.requireNonNull(id, "id");
        QuoteRequest quote = Objects.requireNonNull(quoteRequestRepository.findById(quoteId)
                .orElseThrow(() -> new IllegalArgumentException("Presupuesto no encontrado")), "quote");
        return toResponse(quote);
    }

    @Transactional(readOnly = true)
    public QuoteLifecycleNumbersResponse getLifecycleNumbers(UUID id) {
        UUID quoteId = Objects.requireNonNull(id, "id");
        QuoteRequest quote = Objects.requireNonNull(quoteRequestRepository.findById(quoteId)
                .orElseThrow(() -> new IllegalArgumentException("Presupuesto no encontrado")), "quote");

        DocumentSeries series = QuoteSeriesResolver.resolve(quote);
        String seriesKey = series.date().format(java.time.format.DateTimeFormatter.BASIC_ISO_DATE)
                + "-" + String.format("%04d", series.sequence());

        return new QuoteLifecycleNumbersResponse(
                seriesKey,
                series.format(DocumentPrefix.PTO),
                series.format(DocumentPrefix.PED),
                series.format(DocumentPrefix.ALB),
                series.format(DocumentPrefix.FRA),
                series.format(DocumentPrefix.ABO)
        );
    }

    private QuoteItem toQuoteItem(QuoteRequest quote, CustomerTariff customerTariff, QuoteItemRequest item) {
        Objects.requireNonNull(quote, "quote");
        Objects.requireNonNull(customerTariff, "customerTariff");
        Objects.requireNonNull(item, "item");
        DoorModel doorModel = item.getDoorModel();
        DoorType doorType = item.getDoorType() != null ? item.getDoorType() : item.getOpeningVariant();
        DoorType openingVariant = item.getOpeningVariant() != null ? item.getOpeningVariant() : doorType;

        Integer widthMm = Objects.requireNonNull(item.getWidthMm(), "widthMm");
        Integer heightMm = Objects.requireNonNull(item.getHeightMm(), "heightMm");

        CatalogDoorPricingResult pricing = catalogDoorPricingService.resolve(
                doorModel,
                doorType,
                item.getProductCategory(),
                customerTariff.code(),
                widthMm,
                heightMm
        );
        BigDecimal m2 = pricing.m2();
        BigDecimal pricePerM2 = pricing.pricePerM2();
        BigDecimal lineTotal = m2.multiply(pricePerM2).setScale(2, RoundingMode.HALF_UP);

        return QuoteItem.builder()
                .quoteRequest(quote)
                .doorModel(doorModel)
                .doorType(doorType)
                .productCategory(item.getProductCategory())
                .colorCode(item.getColorCode())
                .primerRequired(item.getPrimerRequired())
                .openingVariant(openingVariant)
                .widthMm(widthMm)
                .heightMm(heightMm)
                .floorClearanceMm(item.getFloorClearanceMm())
                .larguero(item.getLarguero())
                .marcoSuperior(item.getMarcoSuperior())
                .bisagras(item.getBisagras())
                .porteroAutomatico(item.getPorteroAutomatico())
                .unidades(1)
                .m2(m2)
                .pricePerM2(pricePerM2)
                .lineTotal(lineTotal)
                .build();
    }

    private QuoteResponse toResponse(QuoteRequest quote) {
        Customer customer = quote.getCustomer();
        DeliveryAddress delivery = null;
        if (customer != null && customer.getDireccionesEntrega() != null && !customer.getDireccionesEntrega().isEmpty()) {
            delivery = customer.getDireccionesEntrega().get(0);
        }
        return QuoteResponse.builder()
                .id(quote.getId())
                .quoteNumber(quote.getQuoteNumber())
                .customerId(customer != null ? customer.getId() : null)
                .customerName(customer != null
                        ? (customer.getNombreComercial() != null ? customer.getNombreComercial() : customer.getRazonSocial())
                        : null)
                .customerNombreComercial(customer != null ? customer.getNombreComercial() : null)
                .customerTipoDocumento(customer != null && customer.getTipoDocumento() != null ? customer.getTipoDocumento().name() : null)
                .customerNumeroDocumento(customer != null ? customer.getNumeroDocumento() : null)
                .customerTelefono(customer != null ? customer.getTelefono() : null)
                .customerDireccion(customer != null ? customer.getDireccion() : null)
                .customerCp(customer != null ? customer.getCp() : null)
                .customerPoblacion(customer != null ? customer.getPoblacion() : null)
                .customerProvincia(customer != null ? customer.getProvincia() : null)
                .deliveryDireccionEntrega(delivery != null ? delivery.getDireccion() : null)
                .deliveryCp(delivery != null ? delivery.getCp() : null)
                .deliveryPoblacion(delivery != null ? delivery.getPoblacion() : null)
                .deliveryProvincia(delivery != null ? delivery.getProvincia() : null)
                .contactEmail(quote.getContactEmail())
                .contactWhatsapp(quote.getContactWhatsapp())
                .tariffCode(quote.getTariffCode())
                .status(quote.getStatus())
                .validationMode(quote.getValidationMode())
                .channel(quote.getChannel())
                .total(quote.getTotal())
                .createdAt(quote.getCreatedAt())
                .validatedAt(quote.getValidatedAt())
                .sentAt(quote.getSentAt())
                .convertedOrderId(quote.getConvertedOrderId())
                .parentQuoteId(quote.getParentQuoteId())
                .revision(quote.getRevision())
                .items(quote.getItems().stream()
                        .map(item -> QuoteItemResponse.builder()
                                .doorModel(item.getDoorModel())
                                .doorType(item.getDoorType())
                                .productCategory(item.getProductCategory())
                                .colorCode(item.getColorCode())
                                .primerRequired(item.getPrimerRequired())
                                .openingVariant(item.getOpeningVariant())
                                .widthMm(item.getWidthMm())
                                .heightMm(item.getHeightMm())
                                .floorClearanceMm(item.getFloorClearanceMm())
                                .larguero(item.getLarguero())
                                .marcoSuperior(item.getMarcoSuperior())
                                .bisagras(item.getBisagras())
                                .porteroAutomatico(item.getPorteroAutomatico())
                                .m2(item.getM2())
                                .pricePerM2(item.getPricePerM2())
                                .lineTotal(item.getLineTotal())
                                .build())
                        .toList())
                .build();
    }

    private void validateCreate(QuoteCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud es obligatoria");
        }
        if (request.getCustomerId() == null) {
            throw new IllegalArgumentException("El cliente es obligatorio");
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Debe incluir al menos un producto");
        }
        for (QuoteItemRequest item : request.getItems()) {
            if (item == null) {
                throw new IllegalArgumentException("El producto es obligatorio");
            }
            if (item.getDoorModel() == null) {
                throw new IllegalArgumentException("El modelo es obligatorio");
            }
            if (item.getDoorType() == null && item.getOpeningVariant() == null) {
                throw new IllegalArgumentException("El tipo de apertura es obligatorio");
            }
            if (item.getWidthMm() == null || item.getWidthMm() <= 0) {
                throw new IllegalArgumentException("El ancho es obligatorio");
            }
            if (item.getHeightMm() == null || item.getHeightMm() <= 0) {
                throw new IllegalArgumentException("El alto es obligatorio");
            }
        }
    }
}
