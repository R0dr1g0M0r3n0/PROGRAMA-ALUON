package com.aluon.crm.catalog.repository;

import com.aluon.crm.catalog.model.CatalogOption;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CatalogOptionRepository extends JpaRepository<CatalogOption, UUID> {
    List<CatalogOption> findByKindIgnoreCaseAndActiveTrueOrderBySortOrderAscLabelAsc(String kind);
    List<CatalogOption> findAllByOrderByKindAscSortOrderAscLabelAsc();
    boolean existsByKindIgnoreCaseAndCodeIgnoreCase(String kind, String code);
    boolean existsByKindIgnoreCaseAndCodeIgnoreCaseAndIdNot(String kind, String code, UUID id);
}
