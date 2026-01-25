-- Create simple_logs table for the simplified sign-out system
CREATE TABLE IF NOT EXISTS public.simple_logs (
  id TEXT PRIMARY KEY,
  student_name TEXT NOT NULL,
  snack_name TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scan_type TEXT CHECK (scan_type IN ('barcode', 'manual')) DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.simple_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (no auth required for simple mode)
CREATE POLICY "Allow all operations on simple_logs"
  ON public.simple_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to insert a simple log entry
CREATE OR REPLACE FUNCTION public.insert_simple_log(
  log_id TEXT,
  student TEXT,
  snack TEXT,
  log_time TEXT,
  scan_type_val TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.simple_logs (id, student_name, snack_name, timestamp, scan_type)
  VALUES (log_id, student, snack, log_time::timestamp with time zone, scan_type_val)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_simple_logs();

-- Function to get all simple logs
CREATE OR REPLACE FUNCTION public.get_simple_logs()
RETURNS TABLE (
  id TEXT,
  student_name TEXT,
  snack_name TEXT,
  "timestamp" TIMESTAMP WITH TIME ZONE,
  scan_type TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT id, student_name, snack_name, timestamp, scan_type
  FROM public.simple_logs
  ORDER BY timestamp DESC;
$$;

-- Function to clear all simple logs
CREATE OR REPLACE FUNCTION public.clear_simple_logs()
RETURNS VOID
LANGUAGE sql
AS $$
  DELETE FROM public.simple_logs;
$$;
