-- Verify an admin PIN by comparing the submitted PIN against stored hashed PINs.
-- Uses pgcrypto's crypt() function to compare without revealing secrets.
-- The function is SECURITY DEFINER so it can read the admin_pins table while remaining safe for callers.

CREATE OR REPLACE FUNCTION public.verify_admin_pin(submitted_pin TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_pins
    WHERE pin_hash = crypt(submitted_pin, pin_hash)
  );
$$;
