package com.aluon.production.order.service;

import com.aluon.crm.customer.model.Customer;
import com.aluon.crm.customer.service.CustomerService;
import com.aluon.core.user.model.Role;
import com.aluon.core.user.model.User;
import com.aluon.core.user.repository.UserRepository;
import com.aluon.production.cutlist.model.Cutlist;
import com.aluon.production.cutlist.model.CutlistItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import com.aluon.production.order.model.Order;
import com.aluon.production.order.model.OrderAttachment;
import com.aluon.production.order.model.OrderStatus;
import com.aluon.production.order.model.OrderWorkflowStep;
import com.aluon.production.order.repository.OrderRepository;
import com.aluon.production.order.dto.OrderStatusDto;
import com.aluon.production.order.dto.WorkOrderDto;
import com.aluon.production.order.dto.WorkOrderItemDto;
import com.aluon.production.order.dto.WorkOrderRequestDto;
import com.aluon.production.order.dto.WorkOrderRequestResponseDto;
import com.aluon.production.order.dto.OrderAssignRequest;
import com.aluon.production.order.dto.OrderCustomerAssignRequest;
import com.aluon.production.order.dto.OrderCustomerBulkAssignRequest;
import com.aluon.production.order.dto.OrderCustomerBulkAssignResponse;
import com.aluon.crm.quote.model.QuoteItem;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerService customerService;
    private final UserRepository userRepository;
    private final WorkflowProgressService workflowProgress;

    public List<OrderStatusDto> listOrderStatuses() {
        return orderRepository.findAllByOrderByCodigoOrdenDesc().stream()
                .map(order -> OrderStatusDto.builder()
                        .id(order.getId())
                        .customerId(order.getCustomer().getId())
                        .codigoOrden(order.getCodigoOrden())
                        .parentOrderId(order.getParentOrderId())
                        .revision(order.getRevision())
                        .estado(order.getEstado())
                        .workflowStep(order.getWorkflowStep())
                        .workflowStage(order.getWorkflowStage())
                        .assignedUserId(order.getAssignedUser() != null ? order.getAssignedUser().getId() : null)
                        .assignedUserName(order.getAssignedUser() != null
                                ? (order.getAssignedUser().getNombre() + " " + order.getAssignedUser().getApellidos())
                                        .trim()
                                : null)
                        .customerName(order.getCustomer().getNombreComercial() != null
                                ? order.getCustomer().getNombreComercial()
                                : order.getCustomer().getRazonSocial())
                        .modeloPuerta(order.getModeloPuerta())
                        .anchoMm(order.getAnchoMm())
                        .altoMm(order.getAltoMm())
                        .notes(order.getNotes())
                        .color(order.getColor())
                        .installerName(order.getInstallerName())
                        .requestDate(
                                order.getCreatedAt() != null ? order.getCreatedAt().toLocalDate() : LocalDate.now())
                        .m2(calculateM2(order.getAnchoMm(), order.getAltoMm()))
                        .build())
                .toList();
    }

    public WorkOrderDto getWorkOrder(UUID id) {
        UUID orderId = Objects.requireNonNull(id, "id");
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Orden de trabajo no encontrada"));

        Cutlist cutlist = order.getCutlist();
        if (cutlist == null) {
            throw new IllegalArgumentException("La orden no tiene despiece asociado");
        }

        Customer customer = order.getCustomer();
        List<String> addressParts = new java.util.ArrayList<>();
        if (customer.getDireccion() != null && !customer.getDireccion().isBlank()) {
            addressParts.add(customer.getDireccion());
        }
        if (customer.getCp() != null && !customer.getCp().isBlank()) {
            addressParts.add(customer.getCp());
        }
        if (customer.getPoblacion() != null && !customer.getPoblacion().isBlank()) {
            addressParts.add(customer.getPoblacion());
        }
        if (customer.getProvincia() != null && !customer.getProvincia().isBlank()) {
            addressParts.add(customer.getProvincia());
        }
        String address = String.join(" · ", addressParts);

        List<WorkOrderItemDto> items = cutlist.getItems().stream()
                .sorted(Comparator.comparing(CutlistItem::getSortIndex))
                .map(item -> WorkOrderItemDto.builder()
                        .description(item.getDescription())
                        .units(item.getUnits())
                        .cutMeasure(item.getCutMeasure())
                        .build())
                .toList();

        return WorkOrderDto.builder()
                .id(order.getId())
                .codigoOrden(order.getCodigoOrden())
                .estado(order.getEstado())
                .workflowStep(order.getWorkflowStep())
                .workflowStage(order.getWorkflowStage())
                .assignedUserId(order.getAssignedUser() != null ? order.getAssignedUser().getId() : null)
                .assignedUserName(order.getAssignedUser() != null
                        ? (order.getAssignedUser().getNombre() + " " + order.getAssignedUser().getApellidos()).trim()
                        : null)
                .customerId(customer.getId())
                .customerName(customer.getNombreComercial() != null ? customer.getNombreComercial()
                        : customer.getRazonSocial())
                .customerAddress(address)
                .customerPhone(customer.getTelefono())
                .modeloPuerta(order.getModeloPuerta())
                .anchoMm(order.getAnchoMm())
                .altoMm(order.getAltoMm())
                .cutlistId(cutlist.getId())
                .distributor(cutlist.getDistributor())
                .budgetNumber(cutlist.getBudgetNumber())
                .budgetDate(cutlist.getBudgetDate())
                .color(cutlist.getColor())
                .installerName(cutlist.getInstallerName())
                .doorType(cutlist.getDoorType())
                .doorModel(cutlist.getDoorModel())
                .widthMm(cutlist.getWidthMm())
                .heightMm(cutlist.getHeightMm())
                .heightLeftMm(cutlist.getHeightLeftMm())
                .heightRightMm(cutlist.getHeightRightMm())
                .widthLeftMm(cutlist.getWidthLeftMm())
                .widthRightMm(cutlist.getWidthRightMm())
                .groundClearanceMm(cutlist.getGroundClearanceMm())
                .largueroMm(cutlist.getLargueroMm())
                .topFrame(cutlist.getTopFrame())
                .hingesSide(cutlist.getHingesSide())
                .porterAutomatic(cutlist.getPorterAutomatic())
                .automationIncluded(cutlist.getAutomationIncluded())
                .automationReinforcement(cutlist.getAutomationReinforcement())
                .openingSide(cutlist.getOpeningSide())
                .railType(cutlist.getRailType())
                .mountingType(cutlist.getMountingType())
                .tail(cutlist.getTail())
                .notes(cutlist.getNotes())
                .createdAt(cutlist.getCreatedAt())
                .items(items)
                .build();
    }

    @Transactional
    public void assignUser(UUID id, OrderAssignRequest request) {
        if (request == null || request.getUserId() == null) {
            throw new IllegalArgumentException("El usuario es obligatorio");
        }
        UUID orderId = Objects.requireNonNull(id, "id");
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Orden de trabajo no encontrada"));
        Long userId = Objects.requireNonNull(request.getUserId(), "userId");
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        order.setAssignedUser(user);
        orderRepository.save(order);
    }

    @Transactional
    public void assignCustomer(UUID id, OrderCustomerAssignRequest request) {
        if (request == null || request.getCustomerId() == null) {
            throw new IllegalArgumentException("El cliente es obligatorio");
        }
        UUID orderId = Objects.requireNonNull(id, "id");
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Orden de trabajo no encontrada"));
        Customer customer = customerService.findById(request.getCustomerId());
        order.setCustomer(customer);
        orderRepository.save(order);
    }

    @Transactional
    public OrderCustomerBulkAssignResponse assignCustomersBulk(OrderCustomerBulkAssignRequest request) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("La lista de asignaciones es obligatoria");
        }
        int updated = 0;
        int skipped = 0;
        for (OrderCustomerBulkAssignRequest.Item item : request.getItems()) {
            if (item == null || item.getOrderId() == null || item.getCustomerId() == null) {
                skipped++;
                continue;
            }
            UUID bulkOrderId = Objects.requireNonNull(item.getOrderId(), "orderId");
            UUID bulkCustomerId = Objects.requireNonNull(item.getCustomerId(), "customerId");
            Order order = orderRepository.findById(bulkOrderId).orElse(null);
            if (order == null) {
                skipped++;
                continue;
            }
            Customer customer = customerService.findById(bulkCustomerId);
            order.setCustomer(customer);
            orderRepository.save(order);
            updated++;
        }
        return OrderCustomerBulkAssignResponse.builder()
                .updated(updated)
                .skipped(skipped)
                .build();
    }

    @Transactional
    public WorkOrderRequestResponseDto createWorkOrderRequest(WorkOrderRequestDto request) {
        validateRequest(request);

        Customer savedCustomer;
        if (request.getCustomerId() != null) {
            savedCustomer = customerService.findById(request.getCustomerId());
        } else {
            Customer customer = Customer.builder()
                    .nombreComercial(request.getCustomerName().trim())
                    .telefono(normalize(request.getCustomerPhone()))
                    .email(normalize(request.getCustomerEmail()))
                    .build();
            savedCustomer = customerService.save(customer);
        }

        Order order = Order.builder()
                .customer(savedCustomer)
                .codigoOrden(generateCodigoOrden())
                .revision(1)
                .modeloPuerta(request.getModeloPuerta().trim())
                .anchoMm(request.getAnchoMm())
                .altoMm(request.getAltoMm())
                .notes(normalize(request.getNotes()))
                .color(normalize(request.getColor()))
                .installerName(normalize(request.getInstallerName()))
                .createdAt(LocalDateTime.now())
                .estado(OrderStatus.PENDIENTE_MATERIAL)
                .workflowStep(OrderWorkflowStep.INBOX)
                .workflowStage(OrderWorkflowStep.INBOX.name())
                .build();

        Order savedOrder = orderRepository.save(order);
        savedOrder = Objects.requireNonNull(savedOrder, "savedOrder");
        attachFilesIfAny(savedOrder, request.getAttachments());
        return WorkOrderRequestResponseDto.builder()
                .id(savedOrder.getId())
                .codigoOrden(savedOrder.getCodigoOrden())
                .build();
    }

    @Transactional
    public WorkOrderRequestResponseDto createFromQuote(Customer customer, String quoteNumber, QuoteItem item) {
        if (customer == null || item == null) {
            throw new IllegalArgumentException("El presupuesto debe tener cliente y líneas");
        }
        Order order = Order.builder()
                .customer(customer)
                .codigoOrden(generateCodigoOrden())
                .revision(1)
                .modeloPuerta(item.getDoorModel().name() + " · " + item.getDoorType().name())
                .anchoMm(item.getWidthMm())
                .altoMm(item.getHeightMm())
                .notes("Generada desde presupuesto " + quoteNumber)
                .color(normalize(item.getColorCode()))
                .createdAt(LocalDateTime.now())
                .estado(OrderStatus.PENDIENTE_MATERIAL)
                .workflowStep(OrderWorkflowStep.INBOX)
                .workflowStage(OrderWorkflowStep.INBOX.name())
                .build();
        Order saved = Objects.requireNonNull(orderRepository.save(order), "savedOrder");
        return WorkOrderRequestResponseDto.builder().id(saved.getId()).codigoOrden(saved.getCodigoOrden()).build();
    }

    @Transactional
    public WorkOrderRequestResponseDto duplicate(UUID id) {
        Order source = orderRepository.findById(Objects.requireNonNull(id, "id"))
                .orElseThrow(() -> new IllegalArgumentException("Orden de trabajo no encontrada"));
        UUID rootId = source.getParentOrderId() == null ? source.getId() : source.getParentOrderId();
        Order copy = Order.builder()
                .customer(source.getCustomer())
                .assignedUser(source.getAssignedUser())
                .codigoOrden(generateCodigoOrden())
                .parentOrderId(rootId)
                .revision((source.getRevision() == null ? 1 : source.getRevision()) + 1)
                .modeloPuerta(source.getModeloPuerta())
                .anchoMm(source.getAnchoMm())
                .altoMm(source.getAltoMm())
                .notes(source.getNotes())
                .color(source.getColor())
                .installerName(source.getInstallerName())
                .createdAt(LocalDateTime.now())
                .estado(OrderStatus.PENDIENTE_MATERIAL)
                .workflowStep(OrderWorkflowStep.INBOX)
                .workflowStage(OrderWorkflowStep.INBOX.name())
                .build();
        Order saved = orderRepository.save(copy);
        return WorkOrderRequestResponseDto.builder()
                .id(saved.getId()).codigoOrden(saved.getCodigoOrden())
                .parentOrderId(saved.getParentOrderId()).revision(saved.getRevision()).build();
    }

    @Transactional
    public void deleteRequest(UUID id) {
        UUID orderId = Objects.requireNonNull(id, "id");
        Order order = Objects.requireNonNull(orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Solicitud no encontrada")), "order");
        orderRepository.delete(order);
    }

    @Transactional
    public void updateWorkflowStep(String requestId, OrderWorkflowStep workflowStep, String authorizerUserId) {
        System.out.printf("[orders] updateWorkflowStep requestId=%s workflowStep=%s authorizer=%s%n",
                requestId, workflowStep, authorizerUserId);
        if (requestId == null || requestId.isBlank()) {
            throw new IllegalArgumentException("La solicitud es obligatoria");
        }
        if (workflowStep == null) {
            throw new IllegalArgumentException("El estado es obligatorio");
        }

        Order order = workflowProgress.resolveOrder(requestId.trim());
        if (order == null) {
            throw new IllegalArgumentException("Solicitud no encontrada");
        }
        System.out.printf("[orders] resolved order id=%s codigo=%s currentStep=%s currentStage=%s%n",
                order.getId(), order.getCodigoOrden(), order.getWorkflowStep(), order.getWorkflowStage());
        if (order.getWorkflowStep() == workflowStep) {
            return;
        }
        if (workflowProgress.isBackwardTransition(order.getWorkflowStep(), workflowStep)
                && workflowStep != OrderWorkflowStep.INBOX) {
            validateBackwardAuthorization(authorizerUserId);
        }
        order.setWorkflowStep(workflowStep);
        order.setWorkflowStage(workflowStep.name());
        orderRepository.save(order);
        System.out.printf("[orders] persisted workflowStep=%s workflowStage=%s%n",
                order.getWorkflowStep(), order.getWorkflowStage());
    }


    private void validateBackwardAuthorization(String authorizerUserId) {
        if (authorizerUserId == null || authorizerUserId.isBlank()) {
            throw new IllegalArgumentException("Se requiere autorización ADMIN o DIOS para retroceder el estado");
        }
        Long userId;
        try {
            userId = Long.valueOf(authorizerUserId.trim());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("El ID del autorizador debe ser numérico");
        }
        User user = userRepository.findById(Objects.requireNonNull(userId, "userId"))
                .orElseThrow(() -> new IllegalArgumentException("Usuario autorizador no encontrado"));
        if (user.getRol() != Role.ADMIN && user.getRol() != Role.DIOS) {
            throw new IllegalArgumentException("Solo ADMIN o DIOS pueden autorizar retrocesos");
        }
    }

    private void validateRequest(WorkOrderRequestDto request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud es obligatoria");
        }
        if (request.getCustomerId() == null
                && (request.getCustomerName() == null || request.getCustomerName().isBlank())) {
            throw new IllegalArgumentException("El cliente es obligatorio");
        }
        if (request.getModeloPuerta() == null || request.getModeloPuerta().isBlank()) {
            throw new IllegalArgumentException("El modelo es obligatorio");
        }
        if (request.getAnchoMm() == null || request.getAnchoMm() <= 0) {
            throw new IllegalArgumentException("La anchura debe ser mayor que 0");
        }
        if (request.getAltoMm() == null || request.getAltoMm() <= 0) {
            throw new IllegalArgumentException("La altura debe ser mayor que 0");
        }
    }

    private String generateCodigoOrden() {
        String datePart = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        for (int attempt = 0; attempt < 10; attempt++) {
            int random = ThreadLocalRandom.current().nextInt(1000, 9999);
            String code = "OT-" + datePart + "-" + random;
            if (!orderRepository.existsByCodigoOrden(code)) {
                return code;
            }
        }
        throw new IllegalStateException("No se pudo generar un código de orden");
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void attachFilesIfAny(Order order, List<MultipartFile> attachments) {
        if (order == null || attachments == null || attachments.isEmpty()) {
            return;
        }

        boolean updated = false;
        for (MultipartFile file : attachments) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            try {
                order.addAttachment(buildAttachment(file));
                updated = true;
            } catch (RuntimeException ex) {
                log.warn("No se pudo guardar un adjunto para la orden {}: {}", order.getCodigoOrden(), ex.getMessage());
            }
        }

        if (updated) {
            orderRepository.save(order);
        }
    }

    private OrderAttachment buildAttachment(MultipartFile file) {
        try {
            return OrderAttachment.builder()
                    .fileName(file.getOriginalFilename() == null ? "archivo" : file.getOriginalFilename())
                    .contentType(file.getContentType())
                    .fileSize(file.getSize())
                    .fileData(file.getBytes())
                    .createdAt(LocalDateTime.now())
                    .build();
        } catch (Exception ex) {
            throw new IllegalArgumentException("No se pudo leer el archivo adjunto");
        }
    }

    private Double calculateM2(Integer anchoMm, Integer altoMm) {
        if (anchoMm == null || altoMm == null) {
            return 0.0;
        }
        double value = (anchoMm.doubleValue() * altoMm.doubleValue()) / 1_000_000d;
        return Math.round(value * 10d) / 10d;
    }
}
