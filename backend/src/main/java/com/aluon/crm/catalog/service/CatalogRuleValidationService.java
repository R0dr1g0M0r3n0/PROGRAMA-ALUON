package com.aluon.crm.catalog.service;

import com.aluon.crm.catalog.dto.CatalogRuleValidationRequest;
import com.aluon.crm.catalog.dto.CatalogRuleValidationResponse;
import com.aluon.crm.catalog.model.CatalogRule;
import com.aluon.crm.catalog.repository.CatalogRuleRepository;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CatalogRuleValidationService {
    private final CatalogRuleRepository repository;

    @Transactional(readOnly = true)
    public CatalogRuleValidationResponse validate(CatalogRuleValidationRequest request) {
        if (request == null || request.productType() == null || request.productType().isBlank()) {
            return invalid("No se ha indicado la plantilla del configurador.", null);
        }
        JsonNode configuration = request.configuration() == null ? com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode() : request.configuration();
        CatalogRule matrix = repository.findAllByProductTypeAndActiveTrueOrderByRuleKeyAsc(request.productType().trim().toUpperCase()).stream()
                .filter(rule -> "TEMPLATE_MATRIX".equals(rule.getRuleKey()))
                .findFirst().orElse(null);
        if (matrix == null) return invalid("No existe una matriz activa para la plantilla " + request.productType() + ".", null);

        try {
            JsonNode rules = new com.fasterxml.jackson.databind.ObjectMapper().readTree(matrix.getRuleValue());
            List<String> errors = new ArrayList<>();
            requireFields(configuration, rules.path("requiredFields"), errors, rules.path("messages"));
            positiveFields(configuration, rules.path("positiveFields"), errors);
            enumFields(configuration, rules.path("enumFields"), errors, rules.path("messages"));
            customClearance(configuration, rules.path("customClearance"), errors);
            fixedValues(configuration, rules.path("fixedValues"), errors);
            guideDistances(configuration, rules.path("guideDistances"), errors);
            sections(configuration, rules, errors);
            if (rules.has("requiredSketchField") && text(configuration.path(rules.path("requiredSketchField").asText())).isBlank()) errors.add("Seleccione un esquema de fabricación.");
            return new CatalogRuleValidationResponse(errors.isEmpty(), List.copyOf(errors), List.of(), matrix.getId().toString());
        } catch (Exception error) {
            return invalid("La matriz activa de la plantilla no contiene JSON válido.", matrix.getId().toString());
        }
    }

    private void requireFields(JsonNode config, JsonNode fields, List<String> errors, JsonNode messages) {
        if (!fields.isArray()) return;
        fields.forEach(field -> { String name = field.asText(); if (missing(config.path(name))) errors.add(messages.path(name).asText("Complete el campo " + name + ".")); });
    }

    private void positiveFields(JsonNode config, JsonNode fields, List<String> errors) {
        if (!fields.isArray()) return;
        fields.forEach(field -> { String name = field.asText(); JsonNode value = config.path(name); if (!value.isNumber() || value.asDouble() <= 0) errors.add("El campo " + name + " debe ser mayor que cero."); });
    }

    private void enumFields(JsonNode config, JsonNode fields, List<String> errors, JsonNode messages) {
        if (!fields.isObject()) return;
        fields.fields().forEachRemaining(entry -> { String name = entry.getKey(); JsonNode value = config.path(name); boolean allowed = entry.getValue().toString().contains(value.toString()); if (!allowed) errors.add(messages.path(name).asText("El campo " + name + " contiene una opción no válida.")); });
    }

    private void customClearance(JsonNode config, JsonNode rule, List<String> errors) {
        if (!rule.isObject()) return;
        String optionField = rule.path("optionField").asText(); String valueField = rule.path("valueField").asText();
        if (rule.path("otherValue").asText().equals(text(config.path(optionField))) && (!config.path(valueField).isNumber() || config.path(valueField).asDouble() <= 0)) errors.add("La holgura personalizada debe ser mayor que cero.");
    }

    private void fixedValues(JsonNode config, JsonNode rules, List<String> errors) {
        if (!rules.isObject()) return;
        rules.fields().forEachRemaining(entry -> { if (!entry.getValue().toString().equals(config.path(entry.getKey()).toString())) errors.add("La configuración debe mantener " + entry.getKey() + " en " + entry.getValue().asText() + "."); });
    }

    private void guideDistances(JsonNode config, JsonNode rules, List<String> errors) {
        JsonNode selected = rules.path(text(config.path("guideSystem"))); if (!selected.isObject()) return;
        String field = selected.path("field").asText(); if (!config.path(field).isNumber() || config.path(field).asDouble() < selected.path("min").asDouble()) errors.add(selected.path("message").asText("La distancia mínima no se cumple."));
    }

    private void sections(JsonNode config, JsonNode rules, List<String> errors) {
        if (!rules.has("maxSections")) return; JsonNode sections = config.path("sections"); int size = sections.isArray() ? sections.size() : 0;
        if (size < rules.path("minSections").asInt(1) || size > rules.path("maxSections").asInt(8)) errors.add(rules.path("messages").path("sections").asText("El número de tramos no es válido."));
        if (sections.isArray()) sections.forEach(section -> { for (JsonNode field : rules.path("sectionFields")) if (!section.path(field.asText()).isNumber() || section.path(field.asText()).asDouble() <= 0) errors.add(rules.path("messages").path("sectionMeasures").asText("Las medidas del tramo deben ser positivas.")); });
    }

    private boolean missing(JsonNode value) { return value.isMissingNode() || value.isNull() || (value.isTextual() && value.asText().isBlank()); }
    private String text(JsonNode value) { return value.isTextual() ? value.asText() : value.isMissingNode() || value.isNull() ? "" : value.toString(); }
    private CatalogRuleValidationResponse invalid(String error, String ruleId) { return new CatalogRuleValidationResponse(false, List.of(error), List.of(), ruleId); }
}
