package com.aluon.production.order.model;

import com.aluon.crm.customer.model.Customer;
import com.aluon.core.user.model.User;
import com.aluon.production.cutlist.model.Cutlist;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.TenantId;
import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "orders") // "Order" es palabra reservada en SQL.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Multitenancy Field
    @TenantId
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_user_id")
    private User assignedUser;

    @Column(name = "codigo_orden", nullable = false, unique = true)
    private String codigoOrden;

    @Column(name = "parent_order_id")
    private UUID parentOrderId;

    @Builder.Default
    @Column(nullable = false)
    private Integer revision = 1;

    @Column(name = "modelo_puerta", nullable = false)
    private String modeloPuerta;

    @Column(name = "ancho_mm", nullable = false)
    private Integer anchoMm;

    @Column(name = "alto_mm", nullable = false)
    private Integer altoMm;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "color")
    private String color;

    @Column(name = "installer_name")
    private String installerName;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus estado;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "workflow_step", nullable = false)
    private OrderWorkflowStep workflowStep = OrderWorkflowStep.INBOX;

    @Builder.Default
    @Column(name = "workflow_stage", nullable = false)
    private String workflowStage = OrderWorkflowStep.INBOX.name();

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cutlist_id")
    private Cutlist cutlist;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderAttachment> attachments = new ArrayList<>();

    public void addAttachment(OrderAttachment attachment) {
        attachments.add(attachment);
        attachment.setOrder(this);
    }
}
