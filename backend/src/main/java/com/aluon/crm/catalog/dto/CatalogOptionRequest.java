package com.aluon.crm.catalog.dto;

public record CatalogOptionRequest(String kind, String code, String label, String description, String imageUrl, String metadata, Integer sortOrder, Boolean active) {}
