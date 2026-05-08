-- Fixes: register_device was trusting the client-supplied p_user_id.
-- Now verifies it matches auth.uid() and uses auth.uid() for the INSERT.
-- Apply in Supabase Dashboard > SQL Editor.
--
-- NOTE: If your devices table uses different column names than
-- (user_id, name, token, created_at), adjust the INSERT accordingly.

DROP FUNCTION IF EXISTS register_device(uuid, text, text);

CREATE OR REPLACE FUNCTION register_device(p_user_id uuid, p_name text, p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO devices (user_id, name, token, created_at)
  VALUES (auth.uid(), p_name, p_token, now());
END;
$$;
