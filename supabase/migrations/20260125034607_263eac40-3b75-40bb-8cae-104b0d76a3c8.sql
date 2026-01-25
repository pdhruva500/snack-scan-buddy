-- Create simple_logs table for anonymous Simple Mode logging
CREATE TABLE public.simple_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  food_item text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  barcode text,
  crossed_out boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.simple_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert logs (for tablet/kiosk usage)
CREATE POLICY "Anyone can insert simple logs"
ON public.simple_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Anyone can read logs (admin PIN protection is at app level)
CREATE POLICY "Anyone can read simple logs"
ON public.simple_logs
FOR SELECT
TO anon, authenticated
USING (true);

-- Policy: Anyone can update logs (for crossing out)
CREATE POLICY "Anyone can update simple logs"
ON public.simple_logs
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Policy: Anyone can delete logs (admin clears logs)
CREATE POLICY "Anyone can delete simple logs"
ON public.simple_logs
FOR DELETE
TO anon, authenticated
USING (true);