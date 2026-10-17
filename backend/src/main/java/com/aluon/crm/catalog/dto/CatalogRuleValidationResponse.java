package com.aluon.crm.catalog.dto;

import java.util.List;

public record CatalogRuleValidationResponse(boolean valid, List<String> errors, List<String> warnings, String matrixRuleId) { }
