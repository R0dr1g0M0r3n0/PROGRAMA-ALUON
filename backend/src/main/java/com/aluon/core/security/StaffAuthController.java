package com.aluon.core.security;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/staff-auth")
@RequiredArgsConstructor
public class StaffAuthController {
    private final StaffAuthService authService;

    @PostMapping("/login")
    public ResponseEntity<StaffAuthDtos.LoginResponse> login(@RequestBody StaffAuthDtos.LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<StaffAuthDtos.CurrentStaffResponse> me() {
        StaffRequestContext.Identity identity = StaffRequestContext.current();
        if (identity == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(new StaffAuthDtos.CurrentStaffResponse(identity.userId(), identity.username(), "", "", identity.role()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            try { authService.logout(UUID.fromString(authorization.substring(7).trim())); } catch (IllegalArgumentException ignored) {}
        }
        return ResponseEntity.noContent().build();
    }
}
