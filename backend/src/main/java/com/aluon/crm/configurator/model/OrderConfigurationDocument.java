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

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "order_configuration_documents")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderConfigurationDocument {
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

    @Column(name = "document_type", nullable = false, length = 80)
    private String documentType;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "storage_key")
    private String storageKey;

    @Column(name = "mime_type")
    private String mimeType;

    @Column(name = "sha256")
    private String sha256;

    @Column(name = "content_bytes", columnDefinition = "bytea")
    @JdbcTypeCode(SqlTypes.BINARY)
    private byte[] contentBytes;

    @Column(name = "metadata", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String metadata;

    @Column(name = "created_by", nullable = false, length = 120)
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
