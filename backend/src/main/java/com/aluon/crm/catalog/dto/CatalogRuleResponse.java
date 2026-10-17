package com.aluon.crm.catalog.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;
import java.util.UUID;

public record CatalogRuleResponse(
        UUID id,
        String productType,
        String technicalModel,
        String ruleKey,
        JsonNode ruleValue,
        String description,
        Boolean active,
        Boolean provisional,
        LocalDateTime updatedAt
) {}
