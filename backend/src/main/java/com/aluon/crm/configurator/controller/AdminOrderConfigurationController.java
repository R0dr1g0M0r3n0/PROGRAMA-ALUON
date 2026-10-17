package com.aluon.crm.configurator.controller;

import com.aluon.crm.configurator.dto.OrderConfigurationResponse;
import com.aluon.crm.configurator.service.OrderConfigurationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/order-configurations")
@RequiredArgsConstructor
public class AdminOrderConfigurationController {
    private final OrderConfigurationService service;

    @GetMapping
    public List<OrderConfigurationResponse> list(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String productType) {
        return service.adminList(query, status, productType);
    }

    @PatchMapping("/{id}/status")
    public OrderConfigurationResponse status(@PathVariable UUID id, @RequestParam String value,
                                             @RequestParam(required = false) String reason) {
        return service.adminChangeStatus(id, value, reason);
    }

    @PostMapping("/{id}/duplicate")
    public OrderConfigurationResponse duplicate(@PathVariable UUID id) {
        return service.adminDuplicate(id);
    }

    @GetMapping(value = "/export", produces = "text/csv")
    public ResponseEntity<String> export(@RequestParam(required = false) String query,
                                         @RequestParam(required = false) String status,
                                         @RequestParam(required = false) String productType) {
        StringBuilder csv = new StringBuilder("referencia,producto,cliente,distribuidor,estado,version,actualizado\n");
        for (OrderConfigurationResponse item : service.adminList(query, status, productType)) {
            csv.append(csv(item.reference())).append(',')
                    .append(csv(item.productType())).append(',')
                    .append(csv(item.customerName())).append(',')
                    .append(csv(item.distributorName())).append(',')
                    .append(csv(item.status())).append(',')
                    .append(item.version()).append(',')
                    .append(csv(String.valueOf(item.updatedAt())))
                    .append('\n');
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=pedidos-aluon.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv.toString());
    }

    private String csv(String value) {
        String safe = value == null ? "" : value;
        return "\"" + safe.replace("\"", "\"\"") + "\"";
    }
}
