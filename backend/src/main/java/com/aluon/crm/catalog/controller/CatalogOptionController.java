package com.aluon.crm.catalog.controller;

import com.aluon.crm.catalog.dto.CatalogOptionRequest;
import com.aluon.crm.catalog.dto.CatalogOptionResponse;
import com.aluon.crm.catalog.service.CatalogOptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController @RequiredArgsConstructor
public class CatalogOptionController {
    private final CatalogOptionService service;
    @GetMapping("/api/catalog/options") public ResponseEntity<List<CatalogOptionResponse>> list(@RequestParam String kind) { return ResponseEntity.ok(service.listPublic(kind)); }
    @GetMapping("/api/admin/catalog/options") public ResponseEntity<List<CatalogOptionResponse>> listAdmin() { return ResponseEntity.ok(service.listAdmin()); }
    @PostMapping("/api/admin/catalog/options") public ResponseEntity<CatalogOptionResponse> create(@RequestBody CatalogOptionRequest request) { return ResponseEntity.ok(service.create(request)); }
    @PutMapping("/api/admin/catalog/options/{id}") public ResponseEntity<CatalogOptionResponse> update(@PathVariable UUID id, @RequestBody CatalogOptionRequest request) { return ResponseEntity.ok(service.update(id, request)); }
    @DeleteMapping("/api/admin/catalog/options/{id}") public ResponseEntity<Void> delete(@PathVariable UUID id) { service.delete(id); return ResponseEntity.noContent().build(); }
}
