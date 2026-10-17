package com.aluon.crm.catalog.service;

import com.aluon.crm.catalog.dto.CatalogOptionRequest;
import com.aluon.crm.catalog.dto.CatalogOptionResponse;
import com.aluon.crm.catalog.model.CatalogOption;
import com.aluon.crm.catalog.repository.CatalogOptionRepository;
import com.aluon.core.audit.service.AdminAuditService;
import lombok.RequiredArgsConstructor;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service @RequiredArgsConstructor
public class CatalogOptionService {
    private final CatalogOptionRepository repository;
    private final CurrentTenantIdentifierResolver<UUID> tenantResolver;
    private final AdminAuditService auditService;

    @Transactional(readOnly = true)
    public List<CatalogOptionResponse> listPublic(String kind) {
        if (kind == null || kind.isBlank()) return List.of();
        return repository.findByKindIgnoreCaseAndActiveTrueOrderBySortOrderAscLabelAsc(kind.trim()).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CatalogOptionResponse> listAdmin() {
        return repository.findAllByOrderByKindAscSortOrderAscLabelAsc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public CatalogOptionResponse create(CatalogOptionRequest request) {
        String kind = normalize(request.kind(), "kind").toUpperCase();
        String code = normalize(request.code(), "code").toUpperCase();
        if (repository.existsByKindIgnoreCaseAndCodeIgnoreCase(kind, code)) throw new IllegalArgumentException("Ya existe esa opción en el grupo " + kind);
        CatalogOption saved = repository.save(CatalogOption.builder().tenantId(tenantResolver.resolveCurrentTenantIdentifier()).kind(kind).code(code)
                .label(normalize(request.label(), "label")).description(request.description()).imageUrl(request.imageUrl()).metadata(request.metadata() == null || request.metadata().isBlank() ? "{}" : request.metadata()).sortOrder(request.sortOrder() == null ? 0 : request.sortOrder())
                .active(request.active() == null || request.active()).build());
        auditService.record("CREATED", "CATALOG_OPTION", saved.getId().toString(), null, saved.getKind() + "|" + saved.getCode());
        return toResponse(saved);
    }

    @Transactional
    public CatalogOptionResponse update(UUID id, CatalogOptionRequest request) {
        CatalogOption option = repository.findById(Objects.requireNonNull(id)).orElseThrow(() -> new IllegalArgumentException("Opción de catálogo no encontrada"));
        String kind = normalize(request.kind(), "kind").toUpperCase();
        String code = normalize(request.code(), "code").toUpperCase();
        if (repository.existsByKindIgnoreCaseAndCodeIgnoreCaseAndIdNot(kind, code, id)) throw new IllegalArgumentException("Ya existe esa opción en el grupo " + kind);
        option.setKind(kind); option.setCode(code); option.setLabel(normalize(request.label(), "label"));
        option.setDescription(request.description()); option.setImageUrl(request.imageUrl()); option.setMetadata(request.metadata() == null || request.metadata().isBlank() ? "{}" : request.metadata());
        option.setSortOrder(request.sortOrder() == null ? 0 : request.sortOrder()); option.setActive(request.active() == null || request.active());
        CatalogOption saved = repository.save(option);
        auditService.record("UPDATED", "CATALOG_OPTION", saved.getId().toString(), null, saved.getKind() + "|" + saved.getCode());
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        CatalogOption option = repository.findById(Objects.requireNonNull(id)).orElseThrow(() -> new IllegalArgumentException("Opción de catálogo no encontrada"));
        option.setActive(false);
        repository.save(option);
        auditService.record("DEACTIVATED", "CATALOG_OPTION", option.getId().toString(), option.getCode(), "active=false");
    }

    private CatalogOptionResponse toResponse(CatalogOption o) { return new CatalogOptionResponse(o.getId(), o.getKind(), o.getCode(), o.getLabel(), o.getDescription(), o.getImageUrl(), o.getMetadata(), o.getSortOrder(), o.getActive()); }
    private String normalize(String value, String field) { if (value == null || value.trim().isEmpty()) throw new IllegalArgumentException(field + " es obligatorio"); return value.trim(); }
}
