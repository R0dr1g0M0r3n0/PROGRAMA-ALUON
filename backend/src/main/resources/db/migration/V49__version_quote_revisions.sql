ALTER TABLE quote_requests
    ADD COLUMN IF NOT EXISTS parent_quote_id UUID,
    ADD COLUMN IF NOT EXISTS revision INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_quote_requests_parent_quote
    ON quote_requests (tenant_id, parent_quote_id, revision);
