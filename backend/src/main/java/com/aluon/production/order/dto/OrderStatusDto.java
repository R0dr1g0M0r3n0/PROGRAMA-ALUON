package com.aluon.production.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;
import java.time.LocalDate;
import com.aluon.production.order.model.OrderStatus;
import com.aluon.production.order.model.OrderWorkflowStep;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusDto {
    private UUID id;
    private UUID customerId;
    private String codigoOrden;
    private UUID parentOrderId;
    private Integer revision;
    private OrderStatus estado;
    private OrderWorkflowStep workflowStep;
    private String workflowStage;
    private Long assignedUserId;
    private String assignedUserName;
    private String customerName;
    private String modeloPuerta;
    private Integer anchoMm;
    private Integer altoMm;
    private String notes;
    private String color;
    private String installerName;
    private LocalDate requestDate;
    private Double m2;
}
