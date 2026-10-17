package com.aluon.core.distributor.controller;

import com.aluon.core.distributor.dto.DistributorRequest;
import com.aluon.core.distributor.dto.DistributorResponse;
import com.aluon.core.distributor.service.DistributorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController @RequestMapping("/api/admin/distributors") @RequiredArgsConstructor
public class DistributorAdminController {
    private final DistributorService service;
    @GetMapping public List<DistributorResponse> list() { return service.list(); }
    @PostMapping public DistributorResponse create(@RequestBody DistributorRequest request) { return service.create(request); }
    @PutMapping("/{id}") public DistributorResponse update(@PathVariable UUID id, @RequestBody DistributorRequest request) { return service.update(id, request); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> deactivate(@PathVariable UUID id) { service.deactivate(id); return ResponseEntity.noContent().build(); }
}
