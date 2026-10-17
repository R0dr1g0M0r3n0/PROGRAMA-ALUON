CREATE TABLE IF NOT EXISTS order_configurations (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    customer_id UUID,
    customer_name VARCHAR(180),
    reference VARCHAR(80) NOT NULL,
    product_type VARCHAR(40) NOT NULL,
    status VARCHAR(40) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    payload JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    confirmed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_configurations_tenant_status
    ON order_configurations (tenant_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_configurations_reference
    ON order_configurations (tenant_id, reference);
