-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_total_spent(UUID);

-- Create a function to calculate total spent by user
CREATE OR REPLACE FUNCTION get_total_spent(input_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(t.amount)::INTEGER
        FROM transactions t
        WHERE t.user_id = input_user_id
        AND t.status = 'DONE'),
        0
    );
END;
$$ LANGUAGE plpgsql;
