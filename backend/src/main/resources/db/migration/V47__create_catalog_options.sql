CREATE TABLE IF NOT EXISTS catalog_options (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    option_kind VARCHAR(40) NOT NULL,
    code VARCHAR(80) NOT NULL,
    label VARCHAR(160) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_catalog_options_tenant_kind_code UNIQUE (tenant_id, option_kind, code)
);

CREATE INDEX IF NOT EXISTS idx_catalog_options_tenant_kind
    ON catalog_options (tenant_id, option_kind, active, sort_order, label);
