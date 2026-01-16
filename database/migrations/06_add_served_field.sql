-- Migration: Add is_served column to orders table

ALTER TABLE orders 
ADD COLUMN is_served BOOLEAN DEFAULT FALSE;
