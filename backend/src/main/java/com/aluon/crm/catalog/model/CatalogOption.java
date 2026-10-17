package com.aluon.crm.catalog.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.TenantId;
import java.util.UUID;

@Entity
@Table(name = "catalog_options")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CatalogOption {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @TenantId @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    @Column(name = "option_kind", nullable = false, length = 40)
    private String kind;
    @Column(name = "code", nullable = false, length = 80)
    private String code;
    @Column(name = "label", nullable = false, length = 160)
    private String label;
    @Column(name = "description", length = 240)
    private String description;
    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;
    @Column(name = "metadata", nullable = false, columnDefinition = "jsonb")
    private String metadata;
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;
    @Column(name = "active", nullable = false)
    private Boolean active;
}
