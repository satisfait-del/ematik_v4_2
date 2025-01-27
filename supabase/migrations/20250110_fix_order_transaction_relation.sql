-- Drop the existing foreign key constraint from transactions to orders
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS fk_order;

-- Drop the existing foreign key constraint from orders to transactions if it exists
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS fk_transaction;

-- Add the correct foreign key constraint from orders to transactions
ALTER TABLE orders
ADD CONSTRAINT fk_transaction
FOREIGN KEY (transaction_id)
REFERENCES transactions(id)
ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_transaction_id ON orders(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
