ALTER TABLE quote_requests
    ADD COLUMN IF NOT EXISTS converted_order_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS ux_quote_requests_converted_order_id
    ON quote_requests (converted_order_id)
    WHERE converted_order_id IS NOT NULL;
