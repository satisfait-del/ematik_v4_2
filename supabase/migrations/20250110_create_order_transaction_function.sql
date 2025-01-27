-- Créer la fonction qui gère la création atomique d'une commande et sa transaction
CREATE OR REPLACE FUNCTION create_order_with_transaction(
  p_user_id uuid,
  p_amount numeric,
  p_description text,
  p_input_value text,
  p_service jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id uuid;
  v_order_id uuid;
  v_transaction record;
  v_order record;
BEGIN
  -- Commencer une transaction
  BEGIN
    -- 1. Créer la transaction
    INSERT INTO transactions (
      user_id,
      type,
      amount,
      status,
      description
    )
    VALUES (
      p_user_id,
      'achat',
      p_amount,
      'en_cours',
      p_description
    )
    RETURNING id INTO v_transaction_id;

    -- 2. Créer la commande
    INSERT INTO orders (
      user_id,
      status,
      total_amount,
      transaction_id,
      input_value,
      service
    )
    VALUES (
      p_user_id,
      'en_cours',
      p_amount,
      v_transaction_id,
      p_input_value,
      p_service
    )
    RETURNING id INTO v_order_id;

    -- 3. Récupérer les données complètes
    SELECT * INTO v_transaction FROM transactions WHERE id = v_transaction_id;
    SELECT * INTO v_order FROM orders WHERE id = v_order_id;

    -- 4. Retourner les deux objets
    RETURN json_build_object(
      'transaction', row_to_json(v_transaction),
      'order', row_to_json(v_order)
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- En cas d'erreur, annuler la transaction
      RAISE EXCEPTION 'Erreur lors de la création de la commande: %', SQLERRM;
  END;
END;
$$;
