package com.aluon.crm.configurator.model;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "order_configurations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "customer_id")
    private UUID customerId;

    @Column(name = "customer_name", length = 180)
    private String customerName;

    @Column(name = "created_by", nullable = false, length = 120)
    private String createdBy;

    @Column(name = "reference", nullable = false, length = 80)
    private String reference;

    @Column(name = "quote_number")
    private String quoteNumber;

    @Column(name = "quote_date")
    private LocalDate quoteDate;

    @Column(name = "distributor_id")
    private UUID distributorId;

    @Column(name = "distributor_name")
    private String distributorName;

    @Column(name = "template_type")
    private String templateType;

    @Column(name = "model")
    private String model;

    @Column(name = "color")
    private String color;

    @Column(name = "finish")
    private String finish;

    @Column(name = "units", nullable = false)
    private String units;

    @Column(name = "measurements", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String measurements;

    @Column(name = "manufacturing_options", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String manufacturingOptions;

    @Column(name = "notes")
    private String notes;

    @Column(name = "installer_name")
    private String installerName;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Column(name = "confirmed_by")
    private String confirmedBy;

    @Column(name = "confirmed_by_user_id")
    private Long confirmedByUserId;

    @Column(name = "last_modified_by")
    private String lastModifiedBy;

    @Column(name = "last_modified_by_user_id")
    private Long lastModifiedByUserId;

    @Column(name = "annulled_at")
    private LocalDateTime annulledAt;

    @Column(name = "product_type", nullable = false, length = 40)
    private String productType;

    @Column(name = "status", nullable = false, length = 40)
    private String status;

    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "payload", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String payload;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @PrePersist
    void onCreate() {
        if (tenantId == null) tenantId = UUID.fromString("00000000-0000-0000-0000-000000000000");
        if (version == null) version = 1;
        if (status == null || status.isBlank()) status = "DRAFT";
        if (createdBy == null || createdBy.isBlank()) createdBy = "local-dev2";
        if (quoteNumber == null || quoteNumber.isBlank()) quoteNumber = reference;
        if (templateType == null || templateType.isBlank()) templateType = productType;
        if (units == null || units.isBlank()) units = "mm";
        if (measurements == null || measurements.isBlank()) measurements = "{}";
        if (manufacturingOptions == null || manufacturingOptions.isBlank()) manufacturingOptions = "{}";
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
