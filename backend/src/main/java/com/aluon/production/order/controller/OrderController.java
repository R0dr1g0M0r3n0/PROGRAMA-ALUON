package com.aluon.production.order.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.UUID;
import com.aluon.production.order.service.OrderService;
import com.aluon.production.order.dto.OrderStatusDto;
import com.aluon.production.order.dto.WorkOrderDto;
import com.aluon.production.order.dto.WorkOrderRequestDto;
import com.aluon.production.order.dto.WorkOrderRequestResponseDto;
import com.aluon.production.order.dto.OrderWorkflowUpdateRequest;
import com.aluon.production.order.dto.OrderAssignRequest;
import com.aluon.production.order.dto.OrderCustomerAssignRequest;
import com.aluon.production.order.dto.OrderCustomerBulkAssignRequest;
import com.aluon.production.order.dto.OrderCustomerBulkAssignResponse;


@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/{id}/work-order")
    public ResponseEntity<WorkOrderDto> getWorkOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getWorkOrder(id));
    }

    @GetMapping("/status")
    public ResponseEntity<List<OrderStatusDto>> listOrderStatuses() {
        return ResponseEntity.ok(orderService.listOrderStatuses());
    }

    @PostMapping(value = "/requests", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<WorkOrderRequestResponseDto> createRequest(@ModelAttribute WorkOrderRequestDto request) {
        return ResponseEntity.ok(orderService.createWorkOrderRequest(request));
    }

    @DeleteMapping("/requests/{id}")
    public ResponseEntity<Void> deleteRequest(@PathVariable UUID id) {
        orderService.deleteRequest(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<WorkOrderRequestResponseDto> duplicate(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.duplicate(id));
    }

    @PatchMapping("/requests/{requestId}/workflow-step")
    public ResponseEntity<Void> updateWorkflowStep(@PathVariable String requestId,
                                                   @RequestBody OrderWorkflowUpdateRequest request) {
        orderService.updateWorkflowStep(requestId, request.getWorkflowStep(), request.getAuthorizerUserId());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/assigned-user")
    public ResponseEntity<Void> assignUser(@PathVariable UUID id, @RequestBody OrderAssignRequest request) {
        orderService.assignUser(id, request);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/customer")
    public ResponseEntity<Void> assignCustomer(@PathVariable UUID id, @RequestBody OrderCustomerAssignRequest request) {
        orderService.assignCustomer(id, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/customers/backfill")
    public ResponseEntity<OrderCustomerBulkAssignResponse> assignCustomersBulk(
            @RequestBody OrderCustomerBulkAssignRequest request
    ) {
        return ResponseEntity.ok(orderService.assignCustomersBulk(request));
    }
}
