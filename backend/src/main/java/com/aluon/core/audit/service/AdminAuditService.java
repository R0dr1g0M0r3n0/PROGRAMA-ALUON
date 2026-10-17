package com.aluon.core.audit.service;

import com.aluon.core.audit.model.AdminAuditLog;
import com.aluon.core.audit.repository.AdminAuditLogRepository;
import com.aluon.core.security.StaffRequestContext;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminAuditService {
    private static final UUID DEFAULT_TENANT = UUID.fromString("00000000-0000-0000-0000-000000000000");
    private final AdminAuditLogRepository repository;
    private final CurrentTenantIdentifierResolver<UUID> tenantResolver;
    private final ObjectMapper objectMapper;

    @Transactional
    public void record(String action, String resourceType, String resourceId, String beforeJson, String afterJson) {
        StaffRequestContext.Identity identity = StaffRequestContext.current();
        repository.save(AdminAuditLog.builder()
                .tenantId(resolveTenant())
                .actorUserId(identity == null ? null : identity.userId())
                .actorUsername(identity == null ? "system" : identity.username())
                .action(action)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .beforeJson(jsonValue(beforeJson))
                .afterJson(jsonValue(afterJson))
                .metadata("{}")
                .build());
    }

    private String jsonValue(String value) {
        if (value == null || value.isBlank()) return "null";
        try {
            objectMapper.readTree(value);
            return value;
        } catch (JsonProcessingException ignored) {
            try { return objectMapper.writeValueAsString(value); }
            catch (JsonProcessingException error) { throw new IllegalStateException("No se pudo serializar la auditoría.", error); }
        }
    }

    private UUID resolveTenant() {
        UUID tenant = tenantResolver.resolveCurrentTenantIdentifier();
        return tenant == null ? DEFAULT_TENANT : tenant;
    }
}
