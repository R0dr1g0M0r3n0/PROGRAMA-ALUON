ALTER TABLE order_configuration_documents
    ADD COLUMN IF NOT EXISTS content_bytes BYTEA;

CREATE INDEX IF NOT EXISTS idx_order_configuration_documents_type
    ON order_configuration_documents (configuration_id, version, document_type);
