package com.aluon.crm.catalog.dto;

import java.util.UUID;

public record CatalogOptionResponse(UUID id, String kind, String code, String label, String description, String imageUrl, String metadata, Integer sortOrder, Boolean active) {}
