package com.aluon.crm.catalog.controller;

import com.aluon.crm.catalog.dto.CatalogRuleRequest;
import com.aluon.crm.catalog.dto.CatalogRuleResponse;
import com.aluon.crm.catalog.dto.CatalogRuleValidationRequest;
import com.aluon.crm.catalog.dto.CatalogRuleValidationResponse;
import com.aluon.crm.catalog.service.CatalogRuleService;
import com.aluon.crm.catalog.service.CatalogRuleValidationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CatalogRuleController {

    private final CatalogRuleService service;
    private final CatalogRuleValidationService validationService;

    @GetMapping("/api/catalog/rules")
    public ResponseEntity<List<CatalogRuleResponse>> list(@RequestParam(required = false) String productType) {
        return ResponseEntity.ok(service.list(false, productType));
    }

    @PostMapping("/api/catalog/rules/validate")
    public ResponseEntity<CatalogRuleValidationResponse> validate(@RequestBody CatalogRuleValidationRequest request) {
        return ResponseEntity.ok(validationService.validate(request));
    }

    @GetMapping("/api/admin/catalog/rules")
    public ResponseEntity<List<CatalogRuleResponse>> listAdmin() {
        return ResponseEntity.ok(service.list(true, null));
    }

    @PostMapping("/api/admin/catalog/rules")
    public ResponseEntity<CatalogRuleResponse> create(@RequestBody CatalogRuleRequest request) {
        return ResponseEntity.ok(service.create(request));
    }

    @PutMapping("/api/admin/catalog/rules/{id}")
    public ResponseEntity<CatalogRuleResponse> update(@PathVariable UUID id, @RequestBody CatalogRuleRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/api/admin/catalog/rules/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
