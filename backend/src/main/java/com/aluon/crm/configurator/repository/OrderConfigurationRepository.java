package com.aluon.crm.configurator.repository;

import com.aluon.crm.configurator.model.OrderConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrderConfigurationRepository extends JpaRepository<OrderConfiguration, UUID> {
    List<OrderConfiguration> findAllByOrderByUpdatedAtDesc();
    List<OrderConfiguration> findAllByStatusOrderByUpdatedAtDesc(String status);
}
