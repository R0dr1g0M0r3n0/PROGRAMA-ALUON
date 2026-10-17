package com.aluon.crm.configurator.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;
import java.util.UUID;

public record OrderConfigurationDocumentResponse(
        UUID id,
        Integer version,
        String documentType,
        String fileName,
        String storageKey,
        String mimeType,
        String sha256,
        JsonNode metadata,
        String createdBy,
        LocalDateTime createdAt
) {}
