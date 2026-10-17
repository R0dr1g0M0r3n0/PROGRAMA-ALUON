package com.aluon.crm.configurator.service;

import com.aluon.core.security.StaffRequestContext;
import com.aluon.core.audit.service.AdminAuditService;
import com.aluon.crm.configurator.dto.*;
import com.aluon.crm.configurator.model.*;
import com.aluon.crm.configurator.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.List;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderConfigurationService {
    private static final UUID DEFAULT_TENANT = UUID.fromString("00000000-0000-0000-0000-000000000000");
    private static final Set<String> ALLOWED_STATUSES = Set.of("DRAFT", "PENDING_REVIEW", "CONFIRMED", "IN_PRODUCTION", "FINALIZED", "CANCELLED");
    private final OrderConfigurationRepository repository;
    private final OrderConfigurationAuditRepository auditRepository;
    private final OrderConfigurationFenceSectionRepository sectionRepository;
    private final OrderConfigurationDocumentRepository documentRepository;
    private final ObjectMapper objectMapper;
    private final AdminAuditService adminAuditService;

    public OrderConfigurationResponse save(OrderConfigurationRequest request) {
        validateRequest(request);
        String actor = StaffRequestContext.currentActor(); Long actorId = currentUserId(); String status = normalizeStatus(request.status()); JsonNode payload = request.payload();
        OrderConfiguration entity = OrderConfiguration.builder().customerId(request.customerId()).customerName(request.customerName()).createdBy(actor).createdByUserId(actorId)
                    .reference(normalize(request.reference())).quoteNumber(firstText(request.quoteNumber(), payload, "reference", request.reference())).quoteDate(firstDate(request.quoteDate(), payload, "quoteDate"))
                    .distributorId(request.distributorId()).distributorName(firstText(request.distributorName(), payload, "distributorName", request.customerName())).templateType(firstText(request.templateType(), payload, "templateType", request.productType()))
                    .productType(normalize(request.productType())).model(firstText(request.model(), payload, "model", null)).color(firstText(request.color(), payload, "color", null)).finish(firstText(request.finish(), payload, "finish", null))
                    .units(firstText(request.units(), payload, "units", "mm")).measurements(json(request.measurements() != null ? request.measurements() : payload.get("measurements"))).manufacturingOptions(json(request.manufacturingOptions() != null ? request.manufacturingOptions() : payload))
                    .notes(firstText(request.notes(), payload, "notes", null)).installerName(firstText(request.installerName(), payload, "installerName", null)).status(status).version(1).payload(payload.toString())
                    .confirmedAt("CONFIRMED".equals(status) ? LocalDateTime.now() : null).confirmedBy("CONFIRMED".equals(status) ? actor : null).confirmedByUserId("CONFIRMED".equals(status) ? actorId : null).lastModifiedBy(actor).lastModifiedByUserId(actorId).annulledAt("CANCELLED".equals(status) ? LocalDateTime.now() : null).build();
        OrderConfiguration saved = repository.save(entity); persistVersionData(saved, request, payload); audit(saved, "CREATED", array("*"), request.changeReason()); return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderConfigurationResponse> list(String status) { var rows = status == null || status.isBlank() ? repository.findAllByOrderByUpdatedAtDesc() : repository.findAllByStatusOrderByUpdatedAtDesc(normalizeStatus(status)); return rows.stream().map(this::toResponse).toList(); }
    @Transactional(readOnly = true)
    public OrderConfigurationResponse findById(UUID id) { return repository.findById(id).map(this::toResponse).orElseThrow(() -> new IllegalArgumentException("Configuración no encontrada.")); }

    public OrderConfigurationResponse update(UUID id, OrderConfigurationRequest request) {
        validateRequest(request); OrderConfiguration entity = repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Configuración no encontrada."));
        if ("CANCELLED".equals(entity.getStatus())) throw new IllegalStateException("Un pedido anulado no se puede editar.");
        if (("IN_PRODUCTION".equals(entity.getStatus()) || "FINALIZED".equals(entity.getStatus())) && !request.authorizedChange()) throw new IllegalStateException("Los pedidos en fabricación o finalizados requieren autorización explícita para cambiarse.");
        try {
            JsonNode previous = objectMapper.readTree(entity.getPayload()); String status = request.status() == null || request.status().isBlank() ? entity.getStatus() : normalizeStatus(request.status()); String actor = StaffRequestContext.currentActor(); Long actorId = currentUserId();
            entity.setCustomerId(request.customerId()); entity.setCustomerName(request.customerName()); entity.setReference(normalize(request.reference())); entity.setQuoteNumber(firstText(request.quoteNumber(), request.payload(), "reference", request.reference())); entity.setQuoteDate(firstDate(request.quoteDate(), request.payload(), "quoteDate")); entity.setDistributorId(request.distributorId()); entity.setDistributorName(firstText(request.distributorName(), request.payload(), "distributorName", request.customerName())); entity.setTemplateType(firstText(request.templateType(), request.payload(), "templateType", request.productType())); entity.setProductType(normalize(request.productType())); entity.setModel(firstText(request.model(), request.payload(), "model", null)); entity.setColor(firstText(request.color(), request.payload(), "color", null)); entity.setFinish(firstText(request.finish(), request.payload(), "finish", null)); entity.setUnits(firstText(request.units(), request.payload(), "units", "mm")); entity.setMeasurements(json(request.measurements() != null ? request.measurements() : request.payload().get("measurements"))); entity.setManufacturingOptions(json(request.manufacturingOptions() != null ? request.manufacturingOptions() : request.payload())); entity.setNotes(firstText(request.notes(), request.payload(), "notes", null)); entity.setInstallerName(firstText(request.installerName(), request.payload(), "installerName", null)); entity.setStatus(status); entity.setVersion(entity.getVersion() + 1); entity.setPayload(request.payload().toString()); entity.setLastModifiedBy(actor); entity.setLastModifiedByUserId(actorId);
            if ("CONFIRMED".equals(status) && entity.getConfirmedAt() == null) { entity.setConfirmedAt(LocalDateTime.now()); entity.setConfirmedBy(actor); entity.setConfirmedByUserId(actorId); } if ("CANCELLED".equals(status)) entity.setAnnulledAt(LocalDateTime.now());
            OrderConfiguration saved = repository.save(entity); persistVersionData(saved, request, request.payload()); audit(saved, "CONFIRMED".equals(entity.getStatus()) ? "VERSIONED" : "UPDATED", changedFields(previous, request.payload()), request.changeReason()); return toResponse(saved);
        } catch (JsonProcessingException error) { throw new IllegalArgumentException("No se pudo serializar la configuración del pedido.", error); }
    }

    public OrderConfigurationResponse cancel(UUID id, String reason) { OrderConfiguration entity = repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Configuración no encontrada.")); if ("CANCELLED".equals(entity.getStatus())) return toResponse(entity); entity.setStatus("CANCELLED"); entity.setAnnulledAt(LocalDateTime.now()); entity.setVersion(entity.getVersion() + 1); entity.setLastModifiedBy(StaffRequestContext.currentActor()); entity.setLastModifiedByUserId(currentUserId()); OrderConfiguration saved = repository.save(entity); audit(saved, "CANCELLED", array("status", "annulledAt"), reason); return toResponse(saved); }
    @Transactional(readOnly = true)
    public List<OrderConfigurationAuditResponse> history(UUID id) { if (!repository.existsById(id)) throw new IllegalArgumentException("Configuración no encontrada."); return auditRepository.findAllByConfigurationIdOrderByVersionDesc(id).stream().map(this::toAuditResponse).toList(); }

    @Transactional(readOnly = true)
    public OrderConfigurationDocument document(UUID configurationId, UUID documentId) {
        OrderConfigurationDocument document = documentRepository.findById(documentId)
                .filter(item -> configurationId.equals(item.getConfigurationId()))
                .orElseThrow(() -> new IllegalArgumentException("Documento de configuración no encontrado."));
        if (document.getContentBytes() == null || document.getContentBytes().length == 0) {
            throw new IllegalArgumentException("El documento no tiene contenido almacenado.");
        }
        return document;
    }

    @Transactional(readOnly = true)
    public List<OrderConfigurationResponse> adminList(String query, String status, String productType) {
        String normalizedQuery = query == null ? "" : query.trim().toLowerCase();
        String normalizedStatus = status == null || status.isBlank() ? null : normalizeStatus(status);
        String normalizedProduct = productType == null ? "" : productType.trim().toUpperCase();
        return repository.findAllByOrderByUpdatedAtDesc().stream()
                .filter(item -> normalizedStatus == null || normalizedStatus.equals(item.getStatus()))
                .filter(item -> normalizedProduct.isBlank() || normalizedProduct.equals(item.getProductType()))
                .filter(item -> normalizedQuery.isBlank() || String.join(" ", item.getReference(), item.getCustomerName() == null ? "" : item.getCustomerName(), item.getDistributorName() == null ? "" : item.getDistributorName()).toLowerCase().contains(normalizedQuery))
                .map(this::toResponse).toList();
    }

    public OrderConfigurationResponse adminChangeStatus(UUID id, String status, String reason) {
        OrderConfiguration entity = repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Configuración no encontrada."));
        String nextStatus = normalizeStatus(status);
        String previous = entity.getStatus();
        if ("CANCELLED".equals(previous) && !"CANCELLED".equals(nextStatus)) throw new IllegalStateException("Un pedido anulado no puede reactivarse.");
        entity.setStatus(nextStatus); entity.setVersion(entity.getVersion() + 1); entity.setLastModifiedBy(StaffRequestContext.currentActor()); entity.setLastModifiedByUserId(currentUserId());
        if ("CONFIRMED".equals(nextStatus) && entity.getConfirmedAt() == null) { entity.setConfirmedAt(LocalDateTime.now()); entity.setConfirmedBy(StaffRequestContext.currentActor()); entity.setConfirmedByUserId(currentUserId()); }
        if ("CANCELLED".equals(nextStatus)) entity.setAnnulledAt(LocalDateTime.now());
        OrderConfiguration saved = repository.save(entity); audit(saved, "ADMIN_STATUS_CHANGED", array("status"), reason); adminAuditService.record("STATUS_CHANGED", "ORDER_CONFIGURATION", saved.getId().toString(), previous, nextStatus); return toResponse(saved);
    }

    public OrderConfigurationResponse adminDuplicate(UUID id) {
        OrderConfiguration source = repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Configuración no encontrada."));
        String actor = StaffRequestContext.currentActor();
        OrderConfiguration copy = OrderConfiguration.builder().tenantId(DEFAULT_TENANT).customerId(source.getCustomerId()).customerName(source.getCustomerName()).createdBy(actor).createdByUserId(currentUserId()).reference(source.getReference() + "-COPIA").quoteNumber(source.getQuoteNumber()).quoteDate(source.getQuoteDate()).distributorId(source.getDistributorId()).distributorName(source.getDistributorName()).templateType(source.getTemplateType()).productType(source.getProductType()).model(source.getModel()).color(source.getColor()).finish(source.getFinish()).units(source.getUnits()).measurements(source.getMeasurements()).manufacturingOptions(source.getManufacturingOptions()).notes(source.getNotes()).installerName(source.getInstallerName()).status("DRAFT").version(1).payload(source.getPayload()).lastModifiedBy(actor).lastModifiedByUserId(currentUserId()).build();
        OrderConfiguration saved = repository.save(copy); audit(saved, "DUPLICATED", array("*"), "Copia administrativa"); adminAuditService.record("DUPLICATED", "ORDER_CONFIGURATION", saved.getId().toString(), source.getId().toString(), saved.getReference()); return toResponse(saved);
    }

    private void persistVersionData(OrderConfiguration entity, OrderConfigurationRequest request, JsonNode payload) {
        JsonNode sections = request.sections() != null ? request.sections() : payload.get("sections");
        if (sections != null && sections.isArray()) { int number = 0; for (JsonNode section : sections) { if (++number > 8) throw new IllegalArgumentException("Una valla no puede tener más de 8 tramos."); BigDecimal width = decimal(section, "widthMm", "width"); BigDecimal height = decimal(section, "heightMm", "height"); if (width == null || height == null || width.signum() <= 0 || height.signum() <= 0) throw new IllegalArgumentException("Cada tramo debe tener medidas positivas."); sectionRepository.save(OrderConfigurationFenceSection.builder().tenantId(DEFAULT_TENANT).configurationId(entity.getId()).version(entity.getVersion()).sectionNumber(number).width(width).height(height).verticalDimensionLabel(text(section, "verticalDimensionLabel", text(payload, "verticalDimensionLabel", "ALTO"))).encounterType(text(section, "encounterType", "NONE")).options(json(section.get("options"))).createdBy(StaffRequestContext.currentActor()).createdAt(LocalDateTime.now()).build()); } }
        JsonNode documents = request.documents() != null ? request.documents() : payload.get("generatedDocuments");
        if (documents != null && documents.isArray()) {
            for (JsonNode document : documents) {
                byte[] content = decodeContent(document);
                documentRepository.save(OrderConfigurationDocument.builder()
                        .tenantId(DEFAULT_TENANT)
                        .configurationId(entity.getId())
                        .version(entity.getVersion())
                        .documentType(text(document, "documentType", text(document, "type", "ATTACHMENT")))
                        .fileName(text(document, "fileName", text(document, "name", "documento")))
                        .storageKey(text(document, "storageKey", content == null ? null : "db://order-configurations/" + entity.getId() + "/documents"))
                        .mimeType(text(document, "mimeType", content == null ? null : "application/pdf"))
                        .sha256(content == null ? text(document, "sha256", null) : sha256(content))
                        .contentBytes(content)
                        .metadata(jsonWithoutContent(document))
                        .createdBy(StaffRequestContext.currentActor())
                        .createdAt(LocalDateTime.now())
                        .build());
            }
        }
    }

    private void audit(OrderConfiguration entity, String action, ArrayNode changedFields, String reason) { auditRepository.save(OrderConfigurationAudit.builder().tenantId(DEFAULT_TENANT).configurationId(entity.getId()).version(entity.getVersion()).action(action).status(entity.getStatus()).changedBy(StaffRequestContext.currentActor()).changedByUserId(currentUserId()).snapshot(entity.getPayload()).changedFields(changedFields.toString()).changeReason(reason).createdAt(LocalDateTime.now()).build()); }
    private OrderConfigurationResponse toResponse(OrderConfiguration entity) { try { JsonNode payload = objectMapper.readTree(entity.getPayload()); var sections = sectionRepository.findAllByConfigurationIdAndVersionOrderBySectionNumber(entity.getId(), entity.getVersion()).stream().map(item -> new OrderConfigurationSectionResponse(item.getId(), item.getVersion(), item.getSectionNumber(), item.getWidth(), item.getHeight(), item.getVerticalDimensionLabel(), item.getEncounterType(), read(item.getOptions()), item.getCreatedBy())).toList(); var documents = documentRepository.findAllByConfigurationIdAndVersionOrderByCreatedAtDesc(entity.getId(), entity.getVersion()).stream().map(item -> new OrderConfigurationDocumentResponse(item.getId(), item.getVersion(), item.getDocumentType(), item.getFileName(), item.getStorageKey(), item.getMimeType(), item.getSha256(), read(item.getMetadata()), item.getCreatedBy(), item.getCreatedAt())).toList(); return new OrderConfigurationResponse(entity.getId(), entity.getCustomerId(), entity.getCustomerName(), entity.getCreatedBy(), entity.getReference(), entity.getProductType(), entity.getStatus(), entity.getVersion(), payload, entity.getCreatedAt(), entity.getUpdatedAt(), entity.getConfirmedAt(), entity.getQuoteNumber(), entity.getQuoteDate(), entity.getDistributorId(), entity.getDistributorName(), entity.getTemplateType(), entity.getModel(), entity.getColor(), entity.getFinish(), entity.getUnits(), read(entity.getMeasurements()), read(entity.getManufacturingOptions()), entity.getNotes(), entity.getInstallerName(), entity.getConfirmedBy(), entity.getCreatedByUserId(), entity.getConfirmedByUserId(), sections, documents); } catch (JsonProcessingException error) { throw new IllegalStateException("La configuración almacenada contiene JSON inválido.", error); } }
    private OrderConfigurationAuditResponse toAuditResponse(OrderConfigurationAudit item) { return new OrderConfigurationAuditResponse(item.getId(), item.getConfigurationId(), item.getVersion(), item.getAction(), item.getStatus(), item.getChangedBy(), read(item.getSnapshot()), item.getCreatedAt(), read(item.getChangedFields()), item.getChangeReason(), item.getChangedByUserId()); }
    private void validateRequest(OrderConfigurationRequest request) { if (request == null || request.payload() == null) throw new IllegalArgumentException("La configuración del pedido es obligatoria."); if (request.reference() == null || request.reference().isBlank()) throw new IllegalArgumentException("La referencia del pedido es obligatoria."); if (request.productType() == null || request.productType().isBlank()) throw new IllegalArgumentException("El tipo de producto es obligatorio."); }
    private String normalize(String value) { return value.trim().toUpperCase(); }
    private Long currentUserId() { return StaffRequestContext.current() == null ? null : StaffRequestContext.current().userId(); }
    private String json(JsonNode node) { return node == null || node.isNull() ? "{}" : node.toString(); }
    private String jsonWithoutContent(JsonNode node) {
        if (node == null || !node.isObject()) return json(node);
        ObjectNode copy = (ObjectNode) node.deepCopy();
        copy.remove("contentBase64");
        return copy.toString();
    }
    private byte[] decodeContent(JsonNode document) {
        String encoded = text(document, "contentBase64", "");
        if (encoded.isBlank()) return null;
        String value = encoded.contains(",") ? encoded.substring(encoded.indexOf(',') + 1) : encoded;
        try { return Base64.getDecoder().decode(value); }
        catch (IllegalArgumentException error) { throw new IllegalArgumentException("El contenido del documento no es Base64 válido."); }
    }
    private String sha256(byte[] content) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(content);
            StringBuilder result = new StringBuilder();
            for (byte item : digest) result.append(String.format("%02x", item));
            return result.toString();
        } catch (Exception error) { throw new IllegalStateException("No se pudo calcular la huella del documento.", error); }
    }
    private JsonNode read(String value) { try { return objectMapper.readTree(value == null || value.isBlank() ? "{}" : value); } catch (JsonProcessingException error) { throw new IllegalStateException("JSON persistido inválido.", error); } }
    private String text(JsonNode node, String field, String fallback) { return node != null && node.hasNonNull(field) && !node.get(field).asText().isBlank() ? node.get(field).asText() : fallback; }
    private String firstText(String explicit, JsonNode node, String field, String fallback) { return explicit != null && !explicit.isBlank() ? explicit : text(node, field, fallback); }
    private LocalDate firstDate(LocalDate explicit, JsonNode node, String field) { if (explicit != null) return explicit; String value = text(node, field, null); return value == null ? null : LocalDate.parse(value); }
    private BigDecimal decimal(JsonNode node, String primary, String alternate) { String value = text(node, primary, text(node, alternate, null)); return value == null ? null : new BigDecimal(value); }
    private ArrayNode array(String... values) { ArrayNode array = objectMapper.createArrayNode(); for (String value : values) array.add(value); return array; }
    private ArrayNode changedFields(JsonNode before, JsonNode after) { ArrayNode result = objectMapper.createArrayNode(); if (before == null || after == null) { result.add("payload"); return result; } Set<String> names = new HashSet<>(); before.fieldNames().forEachRemaining(names::add); after.fieldNames().forEachRemaining(names::add); names.stream().sorted().filter(name -> !before.path(name).equals(after.path(name))).forEach(result::add); if (result.isEmpty() && !before.equals(after)) result.add("payload"); return result; }
    private String normalizeStatus(String requested) { String status = requested == null || requested.isBlank() ? "DRAFT" : requested.trim().toUpperCase(); if ("TECHNICAL_REVIEW".equals(status)) status = "PENDING_REVIEW"; if (!ALLOWED_STATUSES.contains(status)) throw new IllegalArgumentException("Estado de configuración no válido: " + status); return status; }
}
