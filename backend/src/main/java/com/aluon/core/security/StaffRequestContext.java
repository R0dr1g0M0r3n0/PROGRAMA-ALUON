package com.aluon.core.security;

import com.aluon.core.user.model.Role;

/** Request-local identity. Anonymous local requests remain supported in DEV2. */
public final class StaffRequestContext {
    private static final ThreadLocal<Identity> CURRENT = new ThreadLocal<>();

    private StaffRequestContext() {}

    public static void set(Long userId, String username, Role role) {
        CURRENT.set(new Identity(userId, username, role));
    }

    public static Identity current() {
        return CURRENT.get();
    }

    public static String currentActor() {
        Identity identity = CURRENT.get();
        return identity == null ? "local" : identity.username();
    }

    public static void clear() {
        CURRENT.remove();
    }

    public record Identity(Long userId, String username, Role role) {}
}
