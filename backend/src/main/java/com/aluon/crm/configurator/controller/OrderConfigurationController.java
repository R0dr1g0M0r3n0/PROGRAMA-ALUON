package com.aluon.crm.configurator.controller;

import com.aluon.crm.configurator.dto.OrderConfigurationRequest;
import com.aluon.crm.configurator.dto.OrderConfigurationResponse;
import com.aluon.crm.configurator.dto.OrderConfigurationAuditResponse;
import com.aluon.crm.configurator.service.OrderConfigurationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/order-configurations")
@RequiredArgsConstructor
public class OrderConfigurationController {

    private final OrderConfigurationService service;

    @GetMapping
    public ResponseEntity<List<OrderConfigurationResponse>> list(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(service.list(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderConfigurationResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/{configurationId}/documents/{documentId}")
    public ResponseEntity<byte[]> document(@PathVariable UUID configurationId, @PathVariable UUID documentId) {
        var document = service.document(configurationId, documentId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.getFileName().replace("\"", "") + "\"")
                .contentType(MediaType.parseMediaType(document.getMimeType() == null ? MediaType.APPLICATION_PDF_VALUE : document.getMimeType()))
                .body(document.getContentBytes());
    }

    @PostMapping
    public ResponseEntity<OrderConfigurationResponse> save(@RequestBody OrderConfigurationRequest request) {
        return ResponseEntity.ok(service.save(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderConfigurationResponse> update(@PathVariable UUID id, @RequestBody OrderConfigurationRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<OrderConfigurationAuditResponse>> history(@PathVariable UUID id) {
        return ResponseEntity.ok(service.history(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<OrderConfigurationResponse> cancel(@PathVariable UUID id, @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(service.cancel(id, reason));
    }
}
