package com.aluon.core.distributor.dto;

import java.util.List;

public record DistributorRequest(String code, String name, String legalName, String email, String phone, String address, Integer sortOrder, Boolean active, List<Long> userIds) {}
