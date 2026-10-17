package com.aluon.crm.catalog.dto;

import com.fasterxml.jackson.databind.JsonNode;

public record CatalogRuleValidationRequest(String productType, JsonNode configuration) { }
