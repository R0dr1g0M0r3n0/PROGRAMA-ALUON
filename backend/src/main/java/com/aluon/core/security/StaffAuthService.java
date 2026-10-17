package com.aluon.core.security;

import com.aluon.core.user.model.User;
import com.aluon.core.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class StaffAuthService {
    private static final long EXPIRATION_SECONDS = 8 * 60 * 60;

    private final UserRepository userRepository;
    private final StaffSessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;

    public StaffAuthDtos.LoginResponse login(StaffAuthDtos.LoginRequest request) {
        if (request == null || request.username() == null || request.password() == null) {
            throw new IllegalArgumentException("Usuario y contraseña son obligatorios.");
        }
        User user = userRepository.findByUsername(request.username().trim())
                .orElseThrow(() -> new IllegalArgumentException("Credenciales inválidas."));
        if (!user.isActive()) throw new IllegalArgumentException("El usuario está inactivo.");
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Credenciales inválidas.");
        }
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(EXPIRATION_SECONDS);
        UUID token = UUID.randomUUID();
        sessionRepository.save(StaffSession.builder().token(token).user(user).expiresAt(expiresAt).createdAt(LocalDateTime.now()).build());
        return new StaffAuthDtos.LoginResponse(token.toString(), EXPIRATION_SECONDS, toResponse(user));
    }

    @Transactional(readOnly = true)
    public StaffSession findSession(UUID token) {
        return sessionRepository.findByTokenAndExpiresAtAfter(token, LocalDateTime.now()).orElse(null);
    }

    public void logout(UUID token) {
        sessionRepository.deleteById(token);
    }

    public StaffAuthDtos.CurrentStaffResponse toResponse(User user) {
        return new StaffAuthDtos.CurrentStaffResponse(user.getId(), user.getUsername(), user.getNombre(), user.getApellidos(), user.getRol());
    }
}
