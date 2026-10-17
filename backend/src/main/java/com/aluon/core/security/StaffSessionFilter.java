package com.aluon.core.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

import java.io.IOException;
import java.util.UUID;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
@RequiredArgsConstructor
public class StaffSessionFilter extends OncePerRequestFilter {
    private final StaffAuthService authService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        try {
            if (header != null && header.startsWith("Bearer ")) {
                try {
                    StaffSession session = authService.findSession(UUID.fromString(header.substring(7).trim()));
                    if (session != null && session.getUser() != null) {
                        StaffRequestContext.set(session.getUser().getId(), session.getUser().getUsername(), session.getUser().getRol());
                    }
                } catch (IllegalArgumentException ignored) {
                    // Invalid tokens are treated as anonymous; endpoint authorization can be tightened per environment.
                }
            }
            filterChain.doFilter(request, response);
        } finally {
            StaffRequestContext.clear();
        }
    }
}
