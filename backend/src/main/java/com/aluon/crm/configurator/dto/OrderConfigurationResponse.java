package com.aluon.crm.configurator.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;
import java.util.UUID;
import java.time.LocalDate;
import java.util.List;

public record OrderConfigurationResponse(
        UUID id,
        UUID customerId,
        String customerName,
        String createdBy,
        String reference,
        String productType,
        String status,
        Integer version,
        JsonNode payload,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime confirmedAt,
        String quoteNumber,
        LocalDate quoteDate,
        UUID distributorId,
        String distributorName,
        String templateType,
        String model,
        String color,
        String finish,
        String units,
        JsonNode measurements,
        JsonNode manufacturingOptions,
        String notes,
        String installerName,
        String confirmedBy,
        Long createdByUserId,
        Long confirmedByUserId,
        List<OrderConfigurationSectionResponse> sections,
        List<OrderConfigurationDocumentResponse> documents
) {}
