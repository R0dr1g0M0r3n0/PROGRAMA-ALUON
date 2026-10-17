package com.aluon.crm.configurator.repository;

import com.aluon.crm.configurator.model.OrderConfigurationFenceSection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrderConfigurationFenceSectionRepository extends JpaRepository<OrderConfigurationFenceSection, UUID> {
    List<OrderConfigurationFenceSection> findAllByConfigurationIdAndVersionOrderBySectionNumber(UUID configurationId, Integer version);
}
