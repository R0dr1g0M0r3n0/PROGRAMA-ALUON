package com.aluon.crm.configurator.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.TenantId;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "order_configuration_audit")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderConfigurationAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "configuration_id", nullable = false)
    private UUID configurationId;

    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "action", nullable = false, length = 40)
    private String action;

    @Column(name = "status", nullable = false, length = 40)
    private String status;

    @Column(name = "changed_by", nullable = false, length = 120)
    private String changedBy;

    @Column(name = "snapshot", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String snapshot;

    @Column(name = "changed_fields", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String changedFields;

    @Column(name = "change_reason")
    private String changeReason;

    @Column(name = "changed_by_user_id")
    private Long changedByUserId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (tenantId == null) tenantId = UUID.fromString("00000000-0000-0000-0000-000000000000");
        createdAt = LocalDateTime.now();
    }
}
