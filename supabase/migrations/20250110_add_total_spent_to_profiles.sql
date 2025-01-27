-- Add total_spent column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_spent INTEGER DEFAULT 0;

-- Create function to update total_spent
CREATE OR REPLACE FUNCTION update_profile_total_spent()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.status = 'complete') THEN
        -- When a new completed transaction is created
        UPDATE profiles 
        SET total_spent = total_spent + NEW.amount
        WHERE id = NEW.user_id;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- If status changes to complete, add the amount
        IF (OLD.status != 'complete' AND NEW.status = 'complete') THEN
            UPDATE profiles 
            SET total_spent = total_spent + NEW.amount
            WHERE id = NEW.user_id;
        -- If status changes from complete to something else, subtract the amount
        ELSIF (OLD.status = 'complete' AND NEW.status != 'complete') THEN
            UPDATE profiles 
            SET total_spent = total_spent - NEW.amount
            WHERE id = NEW.user_id;
        END IF;
    ELSIF (TG_OP = 'DELETE' AND OLD.status = 'complete') THEN
        -- When a completed transaction is deleted
        UPDATE profiles 
        SET total_spent = total_spent - OLD.amount
        WHERE id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_profile_total_spent_trigger ON transactions;
CREATE TRIGGER update_profile_total_spent_trigger
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_total_spent();

-- Initialize total_spent for existing profiles
UPDATE profiles p
SET total_spent = COALESCE(
    (SELECT SUM(t.amount)
     FROM transactions t
     WHERE t.user_id = p.id
     AND t.status = 'complete'),
    0
);
