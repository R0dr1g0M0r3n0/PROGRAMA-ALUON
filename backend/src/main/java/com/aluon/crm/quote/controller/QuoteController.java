package com.aluon.crm.quote.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import com.aluon.crm.quote.dto.QuoteCreateRequest;
import com.aluon.crm.quote.dto.QuoteLifecycleNumbersResponse;
import com.aluon.crm.quote.dto.QuoteResponse;
import com.aluon.crm.quote.dto.QuoteSendRequest;
import com.aluon.crm.quote.dto.QuoteUpdateRequest;
import com.aluon.crm.quote.service.QuoteService;
import com.aluon.production.order.dto.WorkOrderRequestResponseDto;


@RestController
@RequestMapping("/api/quotes")
@RequiredArgsConstructor
public class QuoteController {

    private final QuoteService quoteService;

    @PostMapping
    public ResponseEntity<QuoteResponse> create(@RequestBody QuoteCreateRequest request) {
        return ResponseEntity.ok(quoteService.create(request));
    }

    @PostMapping("/{id}/validate")
    public ResponseEntity<QuoteResponse> validate(@PathVariable UUID id) {
        return ResponseEntity.ok(quoteService.validate(id));
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<QuoteResponse> send(@PathVariable UUID id, @RequestBody(required = false) QuoteSendRequest request) {
        return ResponseEntity.ok(quoteService.send(id, request));
    }

    @PostMapping("/{id}/convert-to-order")
    public ResponseEntity<WorkOrderRequestResponseDto> convertToOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(quoteService.convertToOrder(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuoteResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(quoteService.getById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<QuoteResponse> update(@PathVariable UUID id, @RequestBody QuoteUpdateRequest request) {
        return ResponseEntity.ok(quoteService.update(id, request));
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<QuoteResponse> duplicate(@PathVariable UUID id) {
        return ResponseEntity.ok(quoteService.duplicate(id));
    }

    @GetMapping("/{id}/lifecycle-numbers")
    public ResponseEntity<QuoteLifecycleNumbersResponse> getLifecycleNumbers(@PathVariable UUID id) {
        return ResponseEntity.ok(quoteService.getLifecycleNumbers(id));
    }
}
