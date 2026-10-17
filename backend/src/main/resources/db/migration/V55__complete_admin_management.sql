CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    actor_user_id BIGINT,
    actor_username VARCHAR(160),
    action VARCHAR(80) NOT NULL,
    resource_type VARCHAR(80) NOT NULL,
    resource_id VARCHAR(160),
    before_json JSONB,
    after_json JSONB,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_resource
    ON admin_audit_log (tenant_id, resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor
    ON admin_audit_log (tenant_id, actor_user_id, created_at DESC);

ALTER TABLE catalog_options ADD COLUMN IF NOT EXISTS description VARCHAR(240);
ALTER TABLE catalog_options ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE catalog_options ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS distributors (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    code VARCHAR(80) NOT NULL,
    name VARCHAR(180) NOT NULL,
    legal_name VARCHAR(240),
    email VARCHAR(180),
    phone VARCHAR(80),
    address VARCHAR(240),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_distributors_active_order
    ON distributors (tenant_id, active, sort_order, name);

CREATE TABLE IF NOT EXISTS distributor_users (
    distributor_id UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (distributor_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_distributor_users_user ON distributor_users (user_id);
