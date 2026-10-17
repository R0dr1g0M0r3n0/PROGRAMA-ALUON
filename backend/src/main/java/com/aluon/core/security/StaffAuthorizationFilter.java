package com.aluon.core.security;

import com.aluon.core.user.model.Role;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.EnumSet;
import java.util.Set;

/**
 * Enforces the staff boundary for mutating/admin APIs. Read-only local screens
 * remain available in DEV2, while changes to catalog, workflow and production
 * require an authenticated staff identity with the appropriate role.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 2)
public class StaffAuthorizationFilter extends OncePerRequestFilter {
    private static final Set<Role> ADMIN_ROLES = EnumSet.of(Role.SUPERADMIN, Role.ADMIN, Role.DIOS);
    private static final Set<Role> WORKFLOW_ROLES = EnumSet.of(
            Role.SUPERADMIN, Role.ADMIN, Role.DIOS, Role.COMERCIAL, Role.PRODUCCION, Role.DISTRIBUIDOR
    );
    private static final Set<Role> PRODUCTION_ROLES = EnumSet.of(
            Role.SUPERADMIN, Role.ADMIN, Role.DIOS, Role.PRODUCCION, Role.SOLDADOR, Role.MONTADOR
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        String method = request.getMethod();
        Set<Role> allowed = allowedRoles(path, method);

        if (allowed != null) {
            StaffRequestContext.Identity identity = StaffRequestContext.current();
            if (identity == null || identity.role() == null || !allowed.contains(identity.role())) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Se requiere una sesión y un rol autorizado.");
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private Set<Role> allowedRoles(String path, String method) {
        if (path.startsWith("/api/admin/") && !isRead(method)) return ADMIN_ROLES;
        if (path.startsWith("/api/admin/") && isRead(method)) return ADMIN_ROLES;
        if (path.startsWith("/api/orders/") && path.contains("/production-stations/") && !isRead(method)) {
            return PRODUCTION_ROLES;
        }
        if (path.startsWith("/api/orders/requests/") && !isRead(method)) return WORKFLOW_ROLES;
        if (path.matches("/api/orders/[^/]+/(assigned-user|customer)") && !isRead(method)) return WORKFLOW_ROLES;
        if (path.matches("/api/orders/[^/]+/duplicate") && !isRead(method)) return WORKFLOW_ROLES;
        if (path.equals("/api/orders/customers/backfill") && !isRead(method)) return ADMIN_ROLES;
        if (path.equals("/api/order-configurations") && !isRead(method)) return WORKFLOW_ROLES;
        if (path.matches("/api/order-configurations/[^/]+") && !isRead(method)) return WORKFLOW_ROLES;
        return null;
    }

    private boolean isRead(String method) {
        return "GET".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method);
    }
}
