package com.aluon.crm.configurator.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.UUID;
import java.time.LocalDate;

public record OrderConfigurationRequest(
        UUID customerId,
        String customerName,
        String reference,
        String productType,
        String status,
        JsonNode payload,
        UUID distributorId,
        String distributorName,
        String quoteNumber,
        LocalDate quoteDate,
        String templateType,
        String model,
        String color,
        String finish,
        String units,
        JsonNode measurements,
        JsonNode manufacturingOptions,
        JsonNode sections,
        JsonNode documents,
        String notes,
        String installerName,
        String changeReason,
        boolean authorizedChange
) {}
