package com.aluon.core.distributor.model;

import com.aluon.core.user.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.TenantId;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "distributors")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Distributor {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @TenantId @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    @Column(nullable = false, length = 80) private String code;
    @Column(nullable = false, length = 180) private String name;
    @Column(name = "legal_name") private String legalName;
    private String email;
    private String phone;
    private String address;
    @Column(nullable = false) private boolean active;
    @Column(name = "sort_order", nullable = false) private int sortOrder;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt;
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "distributor_users", joinColumns = @JoinColumn(name = "distributor_id"), inverseJoinColumns = @JoinColumn(name = "user_id"))
    @Builder.Default private Set<User> users = new HashSet<>();
    @PrePersist @PreUpdate void touch() { if (tenantId == null) tenantId = UUID.fromString("00000000-0000-0000-0000-000000000000"); if (createdAt == null) createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }
}
