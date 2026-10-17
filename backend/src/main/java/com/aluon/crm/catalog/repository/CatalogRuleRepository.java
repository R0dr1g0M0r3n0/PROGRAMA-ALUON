package com.aluon.crm.catalog.repository;

import com.aluon.crm.catalog.model.CatalogRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CatalogRuleRepository extends JpaRepository<CatalogRule, UUID> {
    List<CatalogRule> findAllByOrderByProductTypeAscTechnicalModelAscRuleKeyAsc();
    List<CatalogRule> findAllByProductTypeAndActiveTrueOrderByRuleKeyAsc(String productType);
}
