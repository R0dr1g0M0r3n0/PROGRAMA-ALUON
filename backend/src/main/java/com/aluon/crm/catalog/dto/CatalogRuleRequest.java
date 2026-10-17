package com.aluon.crm.catalog.dto;

import com.fasterxml.jackson.databind.JsonNode;

public record CatalogRuleRequest(
        String productType,
        String technicalModel,
        String ruleKey,
        JsonNode ruleValue,
        String description,
        Boolean active,
        Boolean provisional
) {}
