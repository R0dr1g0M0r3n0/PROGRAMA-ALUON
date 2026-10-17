package com.aluon.crm.configurator.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;
import java.util.UUID;

public record OrderConfigurationAuditResponse(
        UUID id,
        UUID configurationId,
        Integer version,
        String action,
        String status,
        String changedBy,
        JsonNode snapshot,
        LocalDateTime createdAt,
        JsonNode changedFields,
        String changeReason,
        Long changedByUserId
) {}
