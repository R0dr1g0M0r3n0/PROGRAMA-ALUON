package com.aluon.crm.catalog.service;

import com.aluon.core.audit.service.AdminAuditService;
import com.aluon.crm.catalog.dto.CatalogAdminChildResponse;
import com.aluon.crm.catalog.dto.CatalogAdminFamilyResponse;
import com.aluon.crm.catalog.dto.CatalogChildUpsertRequest;
import com.aluon.crm.catalog.dto.CatalogFamilyUpsertRequest;
import com.aluon.crm.catalog.model.CatalogDoorProduct;
import com.aluon.crm.catalog.model.CatalogProductModel;
import com.aluon.crm.catalog.model.CatalogProductVariant;
import com.aluon.crm.catalog.repository.CatalogDoorProductRepository;
import com.aluon.crm.catalog.repository.CatalogProductModelRepository;
import com.aluon.crm.catalog.repository.CatalogProductVariantRepository;
import com.aluon.production.cutlist.model.DoorType;
import lombok.RequiredArgsConstructor;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CatalogAdminService {

    private final CatalogProductModelRepository modelRepository;
    private final CatalogDoorProductRepository doorProductRepository;
    private final CatalogProductVariantRepository variantRepository;
    private final CurrentTenantIdentifierResolver<UUID> tenantResolver;
    private final AdminAuditService auditService;

    @Transactional(readOnly = true)
    public List<CatalogAdminFamilyResponse> listFamilies() {
        return modelRepository.findAllByOrderByOrdenAscNombreAsc()
                .stream()
                .map(this::toAdminFamilyResponse)
                .toList();
    }

    @Transactional
    public CatalogAdminFamilyResponse createFamily(CatalogFamilyUpsertRequest request) {
        CatalogProductModel family = CatalogProductModel.builder()
                .tenantId(resolveTenantId())
                .modelo(clean(request.technicalModel()))
                .nombre(clean(request.name()))
                .descripcion(cleanNullable(request.description()))
                .imagenCard(cleanNullable(request.imageUrl()))
                .imagenModelo(cleanNullable(request.imageUrl()))
                .orden(request.sortOrder())
                .activo(request.active())
                .build();
        CatalogProductModel saved = modelRepository.save(family);
        auditService.record("CREATED", "CATALOG_MODEL", saved.getId().toString(), null, saved.getModelo() + "|" + saved.getNombre());
        return toAdminFamilyResponse(saved);
    }

    @Transactional
    public CatalogAdminFamilyResponse updateFamily(UUID familyId, CatalogFamilyUpsertRequest request) {
        CatalogProductModel family = requireFamily(familyId);
        family.setModelo(clean(request.technicalModel()));
        family.setNombre(clean(request.name()));
        family.setDescripcion(cleanNullable(request.description()));
        family.setImagenCard(cleanNullable(request.imageUrl()));
        family.setImagenModelo(cleanNullable(request.imageUrl()));
        family.setOrden(request.sortOrder());
        family.setActivo(request.active());
        CatalogProductModel saved = modelRepository.save(family);
        auditService.record("UPDATED", "CATALOG_MODEL", saved.getId().toString(), null, saved.getModelo() + "|" + saved.getNombre());
        return toAdminFamilyResponse(saved);
    }

    @Transactional
    public void deleteFamily(UUID familyId) {
        CatalogProductModel family = requireFamily(familyId);
        family.setActivo(false);
        modelRepository.save(family);
        auditService.record("DEACTIVATED", "CATALOG_MODEL", family.getId().toString(), family.getModelo(), "active=false");
    }

    @Transactional
    public CatalogAdminChildResponse createChild(CatalogChildUpsertRequest request) {
        CatalogProductModel family = requireFamily(request.familyId());
        CatalogDoorProduct doorProduct = findOrCreateDoorProduct(family, request);
        ensureVariantAvailable(doorProduct, request.doorType(), null);
        CatalogProductVariant child = CatalogProductVariant.builder()
                .tenantId(resolveTenantId())
                .puerta(doorProduct)
                .variante(request.doorType())
                .nombre(clean(request.name()))
                .descripcion(cleanNullable(request.description()))
                .imagenCard(cleanNullable(request.imageUrl()))
                .imagenVariante(cleanNullable(request.imageUrl()))
                .orden(request.sortOrder())
                .activo(request.active())
                .build();
        CatalogProductVariant saved = variantRepository.save(child);
        auditService.record("CREATED", "CATALOG_VARIANT", saved.getId().toString(), null, saved.getNombre());
        return toAdminChildResponse(saved);
    }

    @Transactional
    public CatalogAdminChildResponse updateChild(UUID childId, CatalogChildUpsertRequest request) {
        CatalogProductVariant child = requireChild(childId);
        CatalogProductModel family = requireFamily(request.familyId());
        CatalogDoorProduct targetDoorProduct = findOrCreateDoorProduct(family, request);
        CatalogDoorProduct previousDoorProduct = child.getPuerta();

        ensureVariantAvailable(targetDoorProduct, request.doorType(), child.getId());
        child.setPuerta(targetDoorProduct);
        child.setVariante(request.doorType());
        child.setNombre(clean(request.name()));
        child.setDescripcion(cleanNullable(request.description()));
        child.setImagenCard(cleanNullable(request.imageUrl()));
        child.setImagenVariante(cleanNullable(request.imageUrl()));
        child.setOrden(request.sortOrder());
        child.setActivo(request.active());

        CatalogAdminChildResponse response = toAdminChildResponse(variantRepository.save(child));
        auditService.record("UPDATED", "CATALOG_VARIANT", child.getId().toString(), null, child.getNombre());
        deleteDoorProductIfUnused(previousDoorProduct);
        return response;
    }

    @Transactional
    public void deleteChild(UUID childId) {
        CatalogProductVariant child = requireChild(childId);
        CatalogDoorProduct doorProduct = child.getPuerta();
        child.setActivo(false);
        variantRepository.save(child);
        auditService.record("DEACTIVATED", "CATALOG_VARIANT", child.getId().toString(), child.getNombre(), "active=false");
    }

    private CatalogAdminFamilyResponse toAdminFamilyResponse(CatalogProductModel family) {
        List<CatalogAdminChildResponse> children = variantRepository.findAllByFamilyId(family.getId())
                .stream()
                .map(this::toAdminChildResponse)
                .toList();

        return new CatalogAdminFamilyResponse(
                family.getId(),
                family.getModelo(),
                family.getNombre(),
                family.getDescripcion(),
                resolveImage(family.getImagenCard(), family.getImagenModelo()),
                family.getOrden(),
                family.getActivo(),
                children
        );
    }

    private CatalogAdminChildResponse toAdminChildResponse(CatalogProductVariant child) {
        return new CatalogAdminChildResponse(
                child.getId(),
                child.getPuerta().getModelo().getId(),
                child.getPuerta().getProducto(),
                child.getVariante(),
                child.getNombre(),
                child.getDescripcion(),
                resolveImage(child.getImagenCard(), child.getImagenVariante()),
                child.getOrden(),
                child.getActivo()
        );
    }

    private CatalogDoorProduct findOrCreateDoorProduct(CatalogProductModel family, CatalogChildUpsertRequest request) {
        return doorProductRepository.findByModeloIdAndProducto(family.getId(), request.productCategory())
                .orElseGet(() -> doorProductRepository.save(CatalogDoorProduct.builder()
                        .tenantId(resolveTenantId())
                        .modelo(family)
                        .producto(request.productCategory())
                        .imagenModelo(cleanNullable(request.imageUrl()))
                        .build()));
    }

    private void ensureVariantAvailable(CatalogDoorProduct doorProduct, DoorType doorType, UUID currentChildId) {
        variantRepository.findByPuertaAndVariante(doorProduct, doorType)
                .filter(existing -> currentChildId == null || !existing.getId().equals(currentChildId))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Ya existe un hijo configurado con esa categoría y tipo técnico");
                });
    }

    private void deleteDoorProductIfUnused(CatalogDoorProduct doorProduct) {
        if (doorProduct == null || doorProduct.getId() == null) {
            return;
        }
        if (!variantRepository.existsByPuertaId(doorProduct.getId())) {
            doorProductRepository.delete(doorProduct);
        }
    }

    private CatalogProductModel requireFamily(UUID familyId) {
        UUID id = Objects.requireNonNull(familyId, "familyId");
        return modelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Familia no encontrada"));
    }

    private CatalogProductVariant requireChild(UUID childId) {
        UUID id = Objects.requireNonNull(childId, "childId");
        return variantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Hijo no encontrado"));
    }

    private UUID resolveTenantId() {
        return tenantResolver.resolveCurrentTenantIdentifier();
    }

    private String clean(String value) {
        return Objects.requireNonNull(value, "value").trim();
    }

    private String cleanNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String resolveImage(String cardImage, String legacyImage) {
        if (cardImage != null && !cardImage.isBlank()) {
            return cardImage;
        }
        return legacyImage;
    }
}
