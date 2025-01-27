-- Add service and input_value columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS service jsonb,
ADD COLUMN IF NOT EXISTS input_value text;

-- Add comment to explain the columns
COMMENT ON COLUMN orders.service IS 'Stores the complete service information that was purchased';
COMMENT ON COLUMN orders.input_value IS 'Stores the user input value (email, phone, url, or username)';
