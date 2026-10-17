package com.aluon.crm.configurator.repository;

import com.aluon.crm.configurator.model.OrderConfigurationDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrderConfigurationDocumentRepository extends JpaRepository<OrderConfigurationDocument, UUID> {
    List<OrderConfigurationDocument> findAllByConfigurationIdAndVersionOrderByCreatedAtDesc(UUID configurationId, Integer version);
}
