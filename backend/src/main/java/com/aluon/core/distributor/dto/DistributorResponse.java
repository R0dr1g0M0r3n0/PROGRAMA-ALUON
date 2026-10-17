package com.aluon.core.distributor.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record DistributorResponse(UUID id, String code, String name, String legalName, String email, String phone, String address, int sortOrder, boolean active, List<Long> userIds, LocalDateTime updatedAt) {}
