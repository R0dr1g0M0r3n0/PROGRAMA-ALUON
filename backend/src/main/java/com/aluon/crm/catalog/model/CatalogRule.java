package com.aluon.crm.catalog.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.TenantId;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "catalog_rules")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CatalogRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "product_type", nullable = false, length = 40)
    private String productType;

    @Column(name = "technical_model", length = 80)
    private String technicalModel;

    @Column(name = "rule_key", nullable = false, length = 80)
    private String ruleKey;

    @Column(name = "rule_value", nullable = false, columnDefinition = "jsonb")
    private String ruleValue;

    @Column(name = "description", length = 240)
    private String description;

    @Column(name = "active", nullable = false)
    private Boolean active;

    @Column(name = "provisional", nullable = false)
    private Boolean provisional;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        if (tenantId == null) tenantId = UUID.fromString("00000000-0000-0000-0000-000000000000");
        if (active == null) active = true;
        updatedAt = LocalDateTime.now();
    }
}
