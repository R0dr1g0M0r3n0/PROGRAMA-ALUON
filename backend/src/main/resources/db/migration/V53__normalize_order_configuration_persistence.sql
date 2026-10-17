ALTER TABLE order_configurations
    ADD COLUMN IF NOT EXISTS quote_number TEXT,
    ADD COLUMN IF NOT EXISTS quote_date DATE,
    ADD COLUMN IF NOT EXISTS distributor_id UUID,
    ADD COLUMN IF NOT EXISTS distributor_name TEXT,
    ADD COLUMN IF NOT EXISTS template_type TEXT,
    ADD COLUMN IF NOT EXISTS model TEXT,
    ADD COLUMN IF NOT EXISTS color TEXT,
    ADD COLUMN IF NOT EXISTS finish TEXT,
    ADD COLUMN IF NOT EXISTS units TEXT NOT NULL DEFAULT 'mm',
    ADD COLUMN IF NOT EXISTS measurements JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS manufacturing_options JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS installer_name TEXT,
    ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT,
    ADD COLUMN IF NOT EXISTS confirmed_by TEXT,
    ADD COLUMN IF NOT EXISTS confirmed_by_user_id BIGINT,
    ADD COLUMN IF NOT EXISTS annulled_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS last_modified_by TEXT,
    ADD COLUMN IF NOT EXISTS last_modified_by_user_id BIGINT;

UPDATE order_configurations
SET quote_number = COALESCE(quote_number, reference),
    template_type = COALESCE(template_type, product_type)
WHERE quote_number IS NULL OR template_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_order_configurations_quote_number
    ON order_configurations (tenant_id, quote_number);
CREATE INDEX IF NOT EXISTS idx_order_configurations_distributor_status
    ON order_configurations (tenant_id, distributor_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS order_configuration_fence_sections (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    configuration_id UUID NOT NULL REFERENCES order_configurations(id) ON DELETE RESTRICT,
    version INTEGER NOT NULL,
    section_number INTEGER NOT NULL CHECK (section_number > 0 AND section_number <= 8),
    width NUMERIC NOT NULL CHECK (width > 0),
    height NUMERIC NOT NULL CHECK (height > 0),
    vertical_dimension_label TEXT NOT NULL DEFAULT 'ALTO' CHECK (vertical_dimension_label IN ('ALTO', 'ANCHO')),
    encounter_type TEXT NOT NULL DEFAULT 'NONE' CHECK (encounter_type IN ('NONE', 'INNER', 'OUTER')),
    options JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(options) = 'object'),
    created_by TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT ux_order_configuration_fence_section_version UNIQUE (configuration_id, version, section_number)
);

CREATE INDEX IF NOT EXISTS idx_order_configuration_fence_sections_configuration
    ON order_configuration_fence_sections (configuration_id, version, section_number);

CREATE TABLE IF NOT EXISTS order_configuration_documents (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    configuration_id UUID NOT NULL REFERENCES order_configurations(id) ON DELETE RESTRICT,
    version INTEGER NOT NULL,
    document_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    storage_key TEXT,
    mime_type TEXT,
    sha256 TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
    created_by TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_configuration_documents_configuration
    ON order_configuration_documents (configuration_id, version, created_at DESC);

ALTER TABLE order_configuration_audit
    ADD COLUMN IF NOT EXISTS changed_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS change_reason TEXT,
    ADD COLUMN IF NOT EXISTS changed_by_user_id BIGINT;
