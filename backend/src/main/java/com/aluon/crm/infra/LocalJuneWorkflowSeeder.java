package com.aluon.crm.infra;

import com.aluon.core.tenant.service.CurrentTenantIdentifierResolverImpl;
import com.aluon.crm.customer.model.Customer;
import com.aluon.crm.customer.service.CustomerService;
import com.aluon.crm.quote.dto.QuoteRequest;
import com.aluon.crm.quote.model.QuoteChannel;
import com.aluon.crm.quote.model.QuoteDocument;
import com.aluon.crm.quote.model.QuoteItem;
import com.aluon.crm.quote.model.QuoteStatus;
import com.aluon.crm.quote.model.QuoteValidationMode;
import com.aluon.crm.quote.repository.QuoteDocumentRepository;
import com.aluon.crm.quote.repository.QuoteItemRepository;
import com.aluon.crm.quote.repository.QuoteRequestRepository;
import com.aluon.crm.quote.service.QuotePdfService;
import com.aluon.production.cutlist.model.DoorModel;
import com.aluon.production.cutlist.model.DoorType;
import com.aluon.production.order.model.Order;
import com.aluon.production.order.model.OrderStatus;
import com.aluon.production.order.model.OrderWorkflowStep;
import com.aluon.production.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Component
@Profile("local")
@org.springframework.core.annotation.Order(1)
@RequiredArgsConstructor
public class LocalJuneWorkflowSeeder implements ApplicationRunner {

    private static final UUID DEMO_TENANT_ID = new UUID(0L, 0L);
    private static final String SEED_MARKER_EMAIL = "demo.junio@aluon.local";
    private static final String RUNTIME_TENANT_ID_PROP = "APP_TENANT_RUNTIME_ID";

    private final CustomerService customerService;
    private final QuoteRequestRepository quoteRequestRepository;
    private final QuoteItemRepository quoteItemRepository;
    private final QuoteDocumentRepository quoteDocumentRepository;
    private final QuotePdfService quotePdfService;
    private final OrderRepository orderRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        CurrentTenantIdentifierResolverImpl.setTenantId(DEMO_TENANT_ID);
        System.setProperty(RUNTIME_TENANT_ID_PROP, DEMO_TENANT_ID.toString());
        try {
            if (alreadySeeded()) {
                return;
            }
            seedJune2026();
        } finally {
            System.clearProperty(RUNTIME_TENANT_ID_PROP);
            CurrentTenantIdentifierResolverImpl.clear();
        }
    }

    private boolean alreadySeeded() {
        return customerService.findFirstActiveByEmail(SEED_MARKER_EMAIL).isPresent();
    }

    private void seedJune2026() {
        String companyA = LocalSeedNames.companyNameForSeed(SEED_MARKER_EMAIL);
        Customer customerA = customerService.save(Customer.builder()
                .nombreComercial(companyA)
                .personaContacto(LocalSeedNames.contactPersonForSeed(SEED_MARKER_EMAIL))
                .email(SEED_MARKER_EMAIL)
                .telefono("600 000 001")
                .formaPago("TRANSFERENCIA")
                .active(true)
                .build());

        String emailB = "demo.b@aluon.local";
        String companyB = LocalSeedNames.companyNameForSeed(emailB);
        Customer customerB = customerService.save(Customer.builder()
                .nombreComercial(companyB)
                .personaContacto(LocalSeedNames.contactPersonForSeed(emailB))
                .email("demo.b@aluon.local")
                .telefono("600 000 002")
                .formaPago("TRANSFERENCIA")
                .active(true)
                .build());

        QuoteRequest q1 = quoteRequestRepository.save(newQuote(customerA, "P-2026-0601", "2026-06-03T10:30:00",
                QuoteStatus.ENVIADO, new BigDecimal("1250.00")));
        QuoteRequest q2 = quoteRequestRepository.save(newQuote(customerA, "P-2026-0602", "2026-06-10T09:15:00",
                QuoteStatus.VALIDADO, new BigDecimal("890.00")));
        QuoteRequest q3 = quoteRequestRepository.save(newQuote(customerB, "P-2026-0603", "2026-06-14T12:05:00",
                QuoteStatus.ENVIADO, new BigDecimal("2100.00")));
        QuoteRequest q4 = quoteRequestRepository.save(newQuote(customerB, "P-2026-0604", "2026-06-22T17:40:00",
                QuoteStatus.ENVIADO, new BigDecimal("560.00")));

        quoteItemRepository.saveAll(List.of(
                quoteItem(q1, DoorModel.PREMIUM, DoorType.CORREDERA, 2500, 2200, new BigDecimal("5.50"),
                        new BigDecimal("227.27"), q1.getTotal()),
                quoteItem(q2, DoorModel.CLASSIC, DoorType.PEATONAL, 1000, 2100, new BigDecimal("2.10"),
                        new BigDecimal("423.81"), q2.getTotal()),
                quoteItem(q3, DoorModel.INOX, DoorType.ABATIBLE_UNA, 1800, 2200, new BigDecimal("3.96"),
                        new BigDecimal("530.30"), q3.getTotal()),
                quoteItem(q4, DoorModel.VENECIANA, DoorType.VALLA, 3000, 1200, new BigDecimal("3.60"),
                        new BigDecimal("155.56"), q4.getTotal())));

        quoteDocumentRepository.saveAll(List.of(
                doc(q1, "PEDIDO", "PE-2026-0001", "2026-06-05T08:00:00"),
                doc(q1, "ALBARAN", "AL-2026-0001", "2026-06-12T18:20:00"),
                doc(q1, "FACTURA", "FA-2026-0001", "2026-06-13T09:30:00"),

                doc(q3, "PEDIDO", "PE-2026-0002", "2026-06-16T11:10:00"),
                doc(q3, "ALBARAN", "AL-2026-0002", "2026-06-20T16:45:00"),
                doc(q3, "FACTURA", "FA-2026-0002", "2026-06-21T10:15:00"),

                doc(q4, "PEDIDO", "PE-2026-0003", "2026-06-24T09:00:00"),
                doc(q4, "FACTURA", "FA-2026-0003", "2026-06-27T13:05:00")));

        orderRepository.saveAll(List.of(
                order(customerA, "OT-2026-0601", "Premium corredera", 2500, 2200, "2026-06-05T08:10:00",
                        OrderStatus.EN_PRODUCCION, OrderWorkflowStep.PROD),
                order(customerA, "OT-2026-0602", "Classic peatonal", 1000, 2100, "2026-06-11T09:40:00",
                        OrderStatus.PRESUPUESTO, OrderWorkflowStep.BUDGET),
                order(customerB, "OT-2026-0603", "Inox abatible", 1800, 2200, "2026-06-16T11:30:00",
                        OrderStatus.LISTO_MONTAJE, OrderWorkflowStep.FINAL),
                order(customerB, "OT-2026-0604", "Veneciana valla", 3000, 1200, "2026-06-24T09:20:00",
                        OrderStatus.PENDIENTE_MATERIAL, OrderWorkflowStep.REQUEST)));
    }

    private static QuoteRequest newQuote(Customer customer, String quoteNumber, String createdAt, QuoteStatus status,
            BigDecimal total) {
        LocalDateTime created = LocalDateTime.parse(createdAt);
        LocalDateTime validatedAt = status == QuoteStatus.PENDIENTE_VALIDACION ? null : created.plusHours(4);
        LocalDateTime sentAt = status == QuoteStatus.ENVIADO ? created.plusDays(1) : null;

        return QuoteRequest.builder()
                .quoteNumber(quoteNumber)
                .seriesDate(LocalDate.of(2026, Month.JUNE, 1))
                .seriesSequence(null)
                .customer(customer)
                .tariffCode("TARIFA_DEMO")
                .contactEmail(customer.getEmail())
                .contactWhatsapp(customer.getTelefono())
                .status(status)
                .validationMode(QuoteValidationMode.MANUAL)
                .channel(QuoteChannel.EMAIL)
                .total(total)
                .createdAt(created)
                .validatedAt(validatedAt)
                .sentAt(sentAt)
                .build();
    }

    private static QuoteItem quoteItem(
            QuoteRequest quote,
            DoorModel doorModel,
            DoorType doorType,
            int widthMm,
            int heightMm,
            BigDecimal m2,
            BigDecimal pricePerM2,
            BigDecimal lineTotal) {
        return QuoteItem.builder()
                .quoteRequest(quote)
                .doorModel(doorModel)
                .doorType(doorType)
                .widthMm(widthMm)
                .heightMm(heightMm)
                .unidades(1)
                .m2(m2)
                .pricePerM2(pricePerM2)
                .lineTotal(lineTotal)
                .build();
    }

    private QuoteDocument doc(QuoteRequest quote, String tipo, String numero, String createdAt) {
        byte[] data = renderPdf(quote, tipo, numero);
        return QuoteDocument.builder()
                .quoteRequest(quote)
                .tipo(tipo)
                .numeroDocumento(numero)
                .contentType("application/pdf")
                .sha256(sha256Hex(data))
                .data(data)
                .createdAt(LocalDateTime.parse(createdAt))
                .build();
    }

    private byte[] renderPdf(QuoteRequest quote, String tipo, String numero) {
        String normalizedType = tipo == null ? "" : tipo.trim().toUpperCase();
        if ("PRESUPUESTO".equals(normalizedType) || normalizedType.isBlank()) {
            return quotePdfService.renderQuotePdf(quote);
        }
        return quotePdfService.renderQuotePdf(quote, normalizedType, numero);
    }

    private static Order order(
            Customer customer,
            String codigoOrden,
            String modeloPuerta,
            int anchoMm,
            int altoMm,
            String createdAt,
            OrderStatus estado,
            OrderWorkflowStep step) {
        return Order.builder()
                .customer(customer)
                .assignedUser(null)
                .codigoOrden(codigoOrden)
                .modeloPuerta(modeloPuerta)
                .anchoMm(anchoMm)
                .altoMm(altoMm)
                .notes("Seed junio 2026")
                .color("RAL-7016")
                .installerName("Instalador Demo")
                .createdAt(LocalDateTime.parse(createdAt))
                .estado(estado)
                .workflowStep(step)
                .workflowStage(step.name())
                .cutlist(null)
                .attachments(new java.util.ArrayList<>())
                .build();
    }

    private static String sha256Hex(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(data));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
