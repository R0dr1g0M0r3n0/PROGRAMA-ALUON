package com.aluon.crm.configurator.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderConfigurationSectionResponse(
        UUID id,
        Integer version,
        Integer sectionNumber,
        BigDecimal width,
        BigDecimal height,
        String verticalDimensionLabel,
        String encounterType,
        JsonNode options,
        String createdBy
) {}
