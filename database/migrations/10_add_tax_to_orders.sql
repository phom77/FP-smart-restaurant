-- Migration: 10_add_tax_to_orders.sql
-- Purpose: Add tax calculation fields to orders table

-- Add new columns for tax breakdown
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2);

-- Update existing orders to populate subtotal and tax_amount
-- For existing orders, set subtotal = total_amount and tax_amount = 0
UPDATE orders 
SET subtotal = total_amount,
    tax_amount = 0
WHERE subtotal IS NULL;

-- Add comment to clarify the calculation
COMMENT ON COLUMN orders.subtotal IS 'Total of all items before tax';
COMMENT ON COLUMN orders.tax_amount IS 'VAT tax amount calculated from system_settings.vat_rate';
COMMENT ON COLUMN orders.total_amount IS 'Final total: subtotal + tax_amount';
