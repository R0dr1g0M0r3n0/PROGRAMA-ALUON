package com.aluon.core.distributor.service;

import com.aluon.core.audit.service.AdminAuditService;
import com.aluon.core.distributor.dto.DistributorRequest;
import com.aluon.core.distributor.dto.DistributorResponse;
import com.aluon.core.distributor.model.Distributor;
import com.aluon.core.distributor.repository.DistributorRepository;
import com.aluon.core.user.model.User;
import com.aluon.core.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service @RequiredArgsConstructor @Transactional
public class DistributorService {
    private final DistributorRepository repository;
    private final UserRepository userRepository;
    private final CurrentTenantIdentifierResolver<UUID> tenantResolver;
    private final AdminAuditService auditService;

    @Transactional(readOnly = true)
    public List<DistributorResponse> list() { return repository.findAllByOrderBySortOrderAscNameAsc().stream().map(this::toResponse).toList(); }

    public DistributorResponse create(DistributorRequest request) {
        validate(request, null);
        Distributor item = Distributor.builder().tenantId(tenant()).code(clean(request.code())).name(clean(request.name())).legalName(request.legalName()).email(request.email()).phone(request.phone()).address(request.address()).sortOrder(request.sortOrder() == null ? 0 : request.sortOrder()).active(request.active() == null || request.active()).build();
        applyUsers(item, request.userIds());
        Distributor saved = repository.save(item);
        auditService.record("CREATED", "DISTRIBUTOR", saved.getId().toString(), null, saved.getCode() + "|" + saved.getName());
        return toResponse(saved);
    }

    public DistributorResponse update(UUID id, DistributorRequest request) {
        Distributor item = repository.findById(Objects.requireNonNull(id)).orElseThrow(() -> new IllegalArgumentException("Distribuidor no encontrado."));
        validate(request, id);
        item.setCode(clean(request.code())); item.setName(clean(request.name())); item.setLegalName(request.legalName()); item.setEmail(request.email()); item.setPhone(request.phone()); item.setAddress(request.address()); item.setSortOrder(request.sortOrder() == null ? 0 : request.sortOrder()); item.setActive(request.active() == null || request.active()); applyUsers(item, request.userIds());
        Distributor saved = repository.save(item);
        auditService.record("UPDATED", "DISTRIBUTOR", saved.getId().toString(), null, saved.getCode() + "|" + saved.getName());
        return toResponse(saved);
    }

    public void deactivate(UUID id) { Distributor item = repository.findById(Objects.requireNonNull(id)).orElseThrow(() -> new IllegalArgumentException("Distribuidor no encontrado.")); item.setActive(false); repository.save(item); auditService.record("DEACTIVATED", "DISTRIBUTOR", item.getId().toString(), item.getCode(), "active=false"); }

    private void validate(DistributorRequest request, UUID id) { if (request == null || request.code() == null || request.code().isBlank()) throw new IllegalArgumentException("El código del distribuidor es obligatorio."); if (request.name() == null || request.name().isBlank()) throw new IllegalArgumentException("El nombre del distribuidor es obligatorio."); if (id == null ? repository.existsByCodeIgnoreCase(request.code().trim()) : repository.existsByCodeIgnoreCaseAndIdNot(request.code().trim(), id)) throw new IllegalArgumentException("Ya existe un distribuidor con ese código."); }
    private void applyUsers(Distributor item, List<Long> ids) { item.getUsers().clear(); if (ids != null) item.getUsers().addAll(userRepository.findAllById(ids)); }
    private DistributorResponse toResponse(Distributor item) { return new DistributorResponse(item.getId(), item.getCode(), item.getName(), item.getLegalName(), item.getEmail(), item.getPhone(), item.getAddress(), item.getSortOrder(), item.isActive(), item.getUsers().stream().map(User::getId).toList(), item.getUpdatedAt()); }
    private UUID tenant() { UUID value = tenantResolver.resolveCurrentTenantIdentifier(); return value == null ? UUID.fromString("00000000-0000-0000-0000-000000000000") : value; }
    private String clean(String value) { return value.trim(); }
}
