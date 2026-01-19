-- Add needs_invoice column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS needs_invoice BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN orders.needs_invoice IS 'Indicates if customer requested a VAT invoice during payment';
