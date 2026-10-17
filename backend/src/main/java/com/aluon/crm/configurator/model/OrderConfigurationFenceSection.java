package com.aluon.crm.configurator.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.TenantId;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "order_configuration_fence_sections")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderConfigurationFenceSection {
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

    @Column(name = "section_number", nullable = false)
    private Integer sectionNumber;

    @Column(name = "width", nullable = false, precision = 14, scale = 3)
    private BigDecimal width;

    @Column(name = "height", nullable = false, precision = 14, scale = 3)
    private BigDecimal height;

    @Column(name = "vertical_dimension_label", nullable = false, length = 20)
    private String verticalDimensionLabel;

    @Column(name = "encounter_type", nullable = false, length = 20)
    private String encounterType;

    @Column(name = "options", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String options;

    @Column(name = "created_by", nullable = false, length = 120)
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
