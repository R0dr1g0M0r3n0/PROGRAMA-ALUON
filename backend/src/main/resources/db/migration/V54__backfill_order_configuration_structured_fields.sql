UPDATE order_configurations
SET model = COALESCE(model, NULLIF(payload ->> 'model', '')),
    color = COALESCE(color, NULLIF(payload ->> 'color', '')),
    finish = COALESCE(finish, NULLIF(payload ->> 'finish', '')),
    units = COALESCE(NULLIF(payload ->> 'units', ''), units),
    measurements = CASE
        WHEN payload ? 'measurements' AND jsonb_typeof(payload -> 'measurements') = 'object' THEN payload -> 'measurements'
        ELSE measurements
    END,
    manufacturing_options = CASE
        WHEN jsonb_typeof(payload) = 'object' THEN payload
        ELSE manufacturing_options
    END,
    notes = COALESCE(notes, NULLIF(payload ->> 'notes', '')),
    installer_name = COALESCE(installer_name, NULLIF(payload ->> 'installerName', '')),
    quote_date = CASE
        WHEN quote_date IS NULL AND payload ->> 'quoteDate' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN (payload ->> 'quoteDate')::date
        ELSE quote_date
    END
WHERE payload IS NOT NULL;
