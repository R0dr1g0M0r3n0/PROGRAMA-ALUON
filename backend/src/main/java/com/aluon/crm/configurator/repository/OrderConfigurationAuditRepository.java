package com.aluon.crm.configurator.repository;

import com.aluon.crm.configurator.model.OrderConfigurationAudit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrderConfigurationAuditRepository extends JpaRepository<OrderConfigurationAudit, UUID> {
    List<OrderConfigurationAudit> findAllByConfigurationIdOrderByVersionDesc(UUID configurationId);
}
