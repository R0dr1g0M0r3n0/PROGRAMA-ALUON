package com.aluon.production.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkOrderRequestResponseDto {
    private UUID id;
    private String codigoOrden;
    private UUID parentOrderId;
    private Integer revision;
}
