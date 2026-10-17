ALTER TABLE order_configurations
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(120) NOT NULL DEFAULT 'legacy';
