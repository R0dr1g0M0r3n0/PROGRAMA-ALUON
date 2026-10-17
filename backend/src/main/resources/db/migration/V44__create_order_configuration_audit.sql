CREATE TABLE IF NOT EXISTS order_configuration_audit (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    configuration_id UUID NOT NULL REFERENCES order_configurations(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    action VARCHAR(40) NOT NULL,
    status VARCHAR(40) NOT NULL,
    changed_by VARCHAR(120) NOT NULL,
    snapshot JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_configuration_audit_configuration
    ON order_configuration_audit (configuration_id, version DESC);
