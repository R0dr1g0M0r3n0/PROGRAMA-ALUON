package com.aluon.core.security;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface StaffSessionRepository extends JpaRepository<StaffSession, UUID> {
    @EntityGraph(attributePaths = "user")
    Optional<StaffSession> findByTokenAndExpiresAtAfter(UUID token, LocalDateTime now);
}
