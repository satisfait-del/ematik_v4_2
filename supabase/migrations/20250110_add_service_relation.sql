-- Add service_id column to orders table if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id);

-- Add foreign key constraint
ALTER TABLE orders
ADD CONSTRAINT fk_service
FOREIGN KEY (service_id) 
REFERENCES services(id)
ON DELETE SET NULL;
