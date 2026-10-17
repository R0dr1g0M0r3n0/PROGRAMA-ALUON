package com.aluon.core.audit.repository;

import com.aluon.core.audit.model.AdminAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, UUID> {
}
