package com.aluon.core.security;

import com.aluon.core.user.model.Role;

public final class StaffAuthDtos {
    private StaffAuthDtos() {}

    public record LoginRequest(String username, String password) {}
    public record LoginResponse(String token, long expiresInSeconds, CurrentStaffResponse user) {}
    public record CurrentStaffResponse(Long id, String username, String nombre, String apellidos, Role role) {}
}
