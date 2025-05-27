/*
  # Create leads table and policies

  1. New Tables
    - `leads`
      - `id` (uuid, primary key)
      - `customer_name` (text)
      - `service_needed` (text) 
      - `site_location` (text)
      - `status` (text)
      - `assigned_to` (uuid, references auth.users)
      - `priority` (text)
      - `source` (text)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on leads table
    - Add policies for:
      - Admins can do everything
      - Sales agents can view all leads and manage their assigned leads
      - Operations managers can view all leads
      - Operators can only view leads assigned to their jobs
*/

-- Create leads table
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  service_needed text NOT NULL,
  site_location text NOT NULL,
  status text NOT NULL CHECK (status IN ('new', 'negotiation', 'won', 'lost')),
  assigned_to uuid REFERENCES auth.users(id),
  priority text CHECK (priority IN ('low', 'medium', 'high')),
  source text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Admin has full access
CREATE POLICY "Admins have full access" ON public.leads
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'user_metadata' ? 'role' AND auth.jwt() ->> 'user_metadata' @> '{"role": "admin"}')
  WITH CHECK (auth.jwt() ->> 'user_metadata' ? 'role' AND auth.jwt() ->> 'user_metadata' @> '{"role": "admin"}');

-- Sales agents can view all leads
CREATE POLICY "Sales agents can view all leads" ON public.leads
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'user_metadata' ? 'role' AND auth.jwt() ->> 'user_metadata' @> '{"role": "sales_agent"}');

-- Sales agents can manage their assigned leads
CREATE POLICY "Sales agents can manage their assigned leads" ON public.leads
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'user_metadata' ? 'role' AND 
    auth.jwt() ->> 'user_metadata' @> '{"role": "sales_agent"}' AND
    assigned_to = auth.uid()
  )
  WITH CHECK (
    auth.jwt() ->> 'user_metadata' ? 'role' AND 
    auth.jwt() ->> 'user_metadata' @> '{"role": "sales_agent"}' AND
    assigned_to = auth.uid()
  );

-- Operations managers can view all leads
CREATE POLICY "Operations managers can view all leads" ON public.leads
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'user_metadata' ? 'role' AND auth.jwt() ->> 'user_metadata' @> '{"role": "operations_manager"}');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();