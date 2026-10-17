CREATE TABLE IF NOT EXISTS catalog_rules (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    product_type VARCHAR(40) NOT NULL,
    technical_model VARCHAR(80),
    rule_key VARCHAR(80) NOT NULL,
    rule_value JSONB NOT NULL,
    description VARCHAR(240),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP NOT NULL,
    UNIQUE (tenant_id, product_type, technical_model, rule_key)
);

CREATE INDEX IF NOT EXISTS idx_catalog_rules_lookup
    ON catalog_rules (tenant_id, product_type, technical_model, active);
