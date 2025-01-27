-- Add total_spent column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0;

-- Create function to update total_spent
CREATE OR REPLACE FUNCTION update_total_spent()
RETURNS TRIGGER AS $$
BEGIN
  -- Si c'est une nouvelle transaction de type 'achat'
  IF (TG_OP = 'INSERT' AND NEW.type = 'achat') THEN
    -- Mettre à jour le total_spent dans profiles
    UPDATE profiles 
    SET total_spent = COALESCE(total_spent, 0) + NEW.amount
    WHERE id = NEW.user_id;
  
  -- Si c'est une suppression d'une transaction de type 'achat'
  ELSIF (TG_OP = 'DELETE' AND OLD.type = 'achat') THEN
    -- Soustraire le montant du total_spent
    UPDATE profiles 
    SET total_spent = COALESCE(total_spent, 0) - OLD.amount
    WHERE id = OLD.user_id;
  
  -- Si c'est une mise à jour d'une transaction de type 'achat'
  ELSIF (TG_OP = 'UPDATE' AND NEW.type = 'achat') THEN
    -- Mettre à jour le total_spent avec la différence
    UPDATE profiles 
    SET total_spent = COALESCE(total_spent, 0) - OLD.amount + NEW.amount
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_total_spent_trigger ON transactions;

-- Create trigger
CREATE TRIGGER update_total_spent_trigger
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_total_spent();

-- Update existing total_spent values
UPDATE profiles p
SET total_spent = COALESCE(
  (SELECT SUM(amount)
   FROM transactions t
   WHERE t.user_id = p.id
   AND t.type = 'achat'),
  0
);
