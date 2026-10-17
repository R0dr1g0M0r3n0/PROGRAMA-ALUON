ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS parent_order_id UUID,
    ADD COLUMN IF NOT EXISTS revision INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_orders_parent_order_id ON orders(parent_order_id);
