package com.aluon.crm.catalog.service;

import com.aluon.crm.catalog.dto.CatalogRuleRequest;
import com.aluon.crm.catalog.dto.CatalogRuleResponse;
import com.aluon.crm.catalog.model.CatalogRule;
import com.aluon.core.audit.service.AdminAuditService;
import com.aluon.crm.catalog.repository.CatalogRuleRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CatalogRuleService {

    private final CatalogRuleRepository repository;
    private final ObjectMapper objectMapper;
    private final AdminAuditService auditService;

    @Transactional(readOnly = true)
    public List<CatalogRuleResponse> list(boolean admin, String productType) {
        List<CatalogRule> rules = productType == null || productType.isBlank()
                ? repository.findAllByOrderByProductTypeAscTechnicalModelAscRuleKeyAsc()
                : repository.findAllByProductTypeAndActiveTrueOrderByRuleKeyAsc(productType.trim().toUpperCase());
        return rules.stream().filter(rule -> admin || Boolean.TRUE.equals(rule.getActive())).map(this::toResponse).toList();
    }

    @Transactional
    public CatalogRuleResponse create(CatalogRuleRequest request) {
        validate(request);
        try {
            CatalogRule rule = CatalogRule.builder()
                    .productType(clean(request.productType()).toUpperCase())
                    .technicalModel(cleanNullable(request.technicalModel()))
                    .ruleKey(clean(request.ruleKey()).toUpperCase())
                    .ruleValue(objectMapper.writeValueAsString(request.ruleValue()))
                    .description(cleanNullable(request.description()))
                    .active(request.active() == null || request.active())
                    .provisional(request.provisional() == null || request.provisional())
                    .build();
            CatalogRule saved = repository.save(rule);
            auditService.record("CREATED", "CATALOG_RULE", saved.getId().toString(), null, saved.getRuleKey());
            return toResponse(saved);
        } catch (JsonProcessingException error) {
            throw new IllegalArgumentException("La regla debe contener un valor JSON válido.", error);
        }
    }

    @Transactional
    public CatalogRuleResponse update(UUID id, CatalogRuleRequest request) {
        validate(request);
        CatalogRule rule = repository.findById(Objects.requireNonNull(id, "id"))
                .orElseThrow(() -> new IllegalArgumentException("Regla no encontrada."));
        try {
            rule.setProductType(clean(request.productType()).toUpperCase());
            rule.setTechnicalModel(cleanNullable(request.technicalModel()));
            rule.setRuleKey(clean(request.ruleKey()).toUpperCase());
            rule.setRuleValue(objectMapper.writeValueAsString(request.ruleValue()));
            rule.setDescription(cleanNullable(request.description()));
            rule.setActive(request.active() == null || request.active());
            rule.setProvisional(request.provisional() == null || request.provisional());
            CatalogRule saved = repository.save(rule);
            auditService.record("UPDATED", "CATALOG_RULE", saved.getId().toString(), null, saved.getRuleKey());
            return toResponse(saved);
        } catch (JsonProcessingException error) {
            throw new IllegalArgumentException("La regla debe contener un valor JSON válido.", error);
        }
    }

    @Transactional
    public void delete(UUID id) {
        CatalogRule rule = repository.findById(Objects.requireNonNull(id, "id"))
                .orElseThrow(() -> new IllegalArgumentException("Regla no encontrada."));
        rule.setActive(false);
        repository.save(rule);
        auditService.record("DEACTIVATED", "CATALOG_RULE", rule.getId().toString(), rule.getRuleKey(), "active=false");
    }

    private void validate(CatalogRuleRequest request) {
        if (request == null || request.productType() == null || request.productType().isBlank()) throw new IllegalArgumentException("El tipo de producto es obligatorio.");
        if (request.ruleKey() == null || request.ruleKey().isBlank()) throw new IllegalArgumentException("La clave de regla es obligatoria.");
        if (request.ruleValue() == null) throw new IllegalArgumentException("El valor de regla es obligatorio.");
    }

    private CatalogRuleResponse toResponse(CatalogRule rule) {
        try {
            JsonNode value = objectMapper.readTree(rule.getRuleValue());
            return new CatalogRuleResponse(rule.getId(), rule.getProductType(), rule.getTechnicalModel(), rule.getRuleKey(), value, rule.getDescription(), rule.getActive(), Boolean.TRUE.equals(rule.getProvisional()), rule.getUpdatedAt());
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("La regla almacenada no contiene JSON válido.", error);
        }
    }

    private String clean(String value) { return Objects.requireNonNull(value, "value").trim(); }
    private String cleanNullable(String value) { return value == null || value.trim().isEmpty() ? null : value.trim(); }
}
