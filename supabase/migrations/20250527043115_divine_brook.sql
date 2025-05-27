/*
  # Quotation Management Schema

  1. New Tables
    - `quotations`
      - Core quotation details including pricing, status, and versioning
    - `quotation_items`
      - Line items for each quotation with detailed pricing
    - `quotation_statuses`
      - History of status changes for audit trail

  2. Security
    - Enable RLS on all tables
    - Policies for role-based access:
      - Admins: Full access
      - Sales: Create/edit own quotations
      - Operations: View-only access

  3. Changes
    - Added status tracking
    - Version control for quotations
    - Detailed pricing breakdown
*/

-- Create quotation status enum
CREATE TYPE quotation_status AS ENUM (
  'draft',
  'pending_review',
  'approved',
  'sent',
  'accepted',
  'rejected',
  'expired'
);

-- Create quotations table
CREATE TABLE public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  status quotation_status NOT NULL DEFAULT 'draft',
  base_rate numeric(10,2) NOT NULL,
  working_hours integer NOT NULL DEFAULT 8,
  rental_days integer NOT NULL DEFAULT 1,
  food_charge numeric(10,2) DEFAULT 0,
  accom_charge numeric(10,2) DEFAULT 0,
  num_resources integer NOT NULL DEFAULT 1,
  usage_percent numeric(5,2) DEFAULT 0,
  elongation_percent numeric(5,2) DEFAULT 0,
  commercial_charge numeric(10,2) DEFAULT 0,
  risk_percent numeric(5,2) DEFAULT 0,
  incidental_charge numeric(10,2) DEFAULT 0,
  other_charge numeric(10,2) DEFAULT 0,
  total_amount numeric(12,2) NOT NULL,
  valid_until timestamptz,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(lead_id, version)
);

-- Create quotation items table for line items
CREATE TABLE public.quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid REFERENCES public.quotations(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  amount numeric(10,2) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create quotation status history table
CREATE TABLE public.quotation_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid REFERENCES public.quotations(id) ON DELETE CASCADE,
  status quotation_status NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_statuses ENABLE ROW LEVEL SECURITY;

-- Create policies for quotations

-- Admin has full access
CREATE POLICY "Admins have full access to quotations"
  ON public.quotations
  FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin');

-- Sales agents can view all quotations
CREATE POLICY "Sales agents can view all quotations"
  ON public.quotations
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'sales_agent');

-- Sales agents can manage their own quotations
CREATE POLICY "Sales agents can manage their quotations"
  ON public.quotations
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'sales_agent'
    AND created_by = auth.uid()
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'sales_agent'
    AND created_by = auth.uid()
  );

-- Operations managers can view all quotations
CREATE POLICY "Operations managers can view quotations"
  ON public.quotations
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'operations_manager');

-- Create policies for quotation items

-- Inherit access from parent quotation
CREATE POLICY "Inherit quotation access for items"
  ON public.quotation_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_id
      AND (
        -- Admin access
        ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin')
        OR
        -- Sales agent access (own quotations)
        ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'sales_agent' 
         AND q.created_by = auth.uid())
        OR
        -- Operations manager view access
        ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'operations_manager')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_id
      AND (
        ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin')
        OR
        ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'sales_agent' 
         AND q.created_by = auth.uid())
      )
    )
  );

-- Create policies for quotation status history

-- Inherit view access from parent quotation
CREATE POLICY "Inherit quotation access for status history"
  ON public.quotation_statuses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_id
      AND (
        ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin')
        OR
        ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'sales_agent')
        OR
        ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'operations_manager')
      )
    )
  );

-- Only admins and sales agents can add status history
CREATE POLICY "Restrict status history creation"
  ON public.quotation_statuses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'sales_agent')
  );

-- Create updated_at triggers
CREATE TRIGGER update_quotations_updated_at
  BEFORE UPDATE ON public.quotations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotation_items_updated_at
  BEFORE UPDATE ON public.quotation_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle quotation versioning
CREATE OR REPLACE FUNCTION create_quotation_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the latest version for this lead
  SELECT COALESCE(MAX(version), 0) + 1
  INTO NEW.version
  FROM public.quotations
  WHERE lead_id = NEW.lead_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quotation versioning
CREATE TRIGGER handle_quotation_versioning
  BEFORE INSERT ON public.quotations
  FOR EACH ROW
  EXECUTE FUNCTION create_quotation_version();

-- Create function to track status changes
CREATE OR REPLACE FUNCTION track_quotation_status()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS NULL) OR (NEW.status != OLD.status) THEN
    INSERT INTO public.quotation_statuses (
      quotation_id,
      status,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      NEW.status,
      auth.uid(),
      'Status changed to ' || NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status tracking
CREATE TRIGGER track_status_changes
  AFTER INSERT OR UPDATE ON public.quotations
  FOR EACH ROW
  EXECUTE FUNCTION track_quotation_status();