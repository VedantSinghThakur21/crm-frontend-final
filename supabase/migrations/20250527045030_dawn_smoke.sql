/*
  # Job Scheduling Schema

  1. New Tables
    - equipment: Stores crane and equipment information
    - operators: Stores operator profiles
    - jobs: Stores job assignments and schedules
    - job_status_history: Tracks job status changes

  2. Security
    - Enable RLS on all tables
    - Add policies for different user roles
    - Track status changes with triggers

  3. Initial Data
    - Add sample equipment records
*/

-- Create equipment table
CREATE TABLE public.equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  description text,
  base_rate numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create operators table
CREATE TABLE public.operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  specialization text NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'off_duty')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create jobs table
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id),
  customer_name text NOT NULL,
  equipment_id uuid REFERENCES public.equipment(id),
  operator_id uuid REFERENCES public.operators(id),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  location text NOT NULL,
  status text NOT NULL CHECK (status IN ('scheduled', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Create job status history table
CREATE TABLE public.job_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_status_history ENABLE ROW LEVEL SECURITY;

-- Equipment policies
CREATE POLICY "Admins have full access to equipment"
  ON public.equipment FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin');

CREATE POLICY "Operations managers can manage equipment"
  ON public.equipment FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'operations_manager')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'operations_manager');

CREATE POLICY "Others can view equipment"
  ON public.equipment FOR SELECT TO authenticated
  USING (true);

-- Operator policies
CREATE POLICY "Admins have full access to operators"
  ON public.operators FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin');

CREATE POLICY "Operations managers can manage operators"
  ON public.operators FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'operations_manager')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'operations_manager');

CREATE POLICY "Operators can view their own profile"
  ON public.operators FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Job policies
CREATE POLICY "Admins have full access to jobs"
  ON public.jobs FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin');

CREATE POLICY "Operations managers can manage jobs"
  ON public.jobs FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'operations_manager')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'operations_manager');

CREATE POLICY "Operators can view and update assigned jobs"
  ON public.jobs FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'operator'
    AND operator_id IN (
      SELECT id FROM public.operators WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'operator'
    AND operator_id IN (
      SELECT id FROM public.operators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Sales agents can view jobs"
  ON public.jobs FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'sales_agent');

-- Job status history policies
CREATE POLICY "View own job status history"
  ON public.job_status_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id
      AND (
        (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'operations_manager')
        OR (
          (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'operator'
          AND j.operator_id IN (SELECT id FROM public.operators WHERE user_id = auth.uid())
        )
      )
    )
  );

-- Create updated_at triggers
CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operators_updated_at
  BEFORE UPDATE ON public.operators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to track job status changes
CREATE OR REPLACE FUNCTION track_job_status()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS NULL) OR (NEW.status != OLD.status) THEN
    INSERT INTO public.job_status_history (
      job_id,
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

-- Create trigger for job status tracking
CREATE TRIGGER track_job_status_changes
  AFTER INSERT OR UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION track_job_status();

-- Insert initial equipment data
INSERT INTO public.equipment (name, type, description, base_rate) VALUES
  ('Tower Crane TC-50', 'Tower Crane', '50m height, 5 ton capacity', 5000),
  ('Mobile Crane MC-30', 'Mobile Crane', '30 ton capacity, extends to 40m', 3500),
  ('Crawler Crane CC-100', 'Crawler Crane', '100 ton capacity, heavy duty', 8000),
  ('Tower Crane TC-80', 'Tower Crane', '80m height, 8 ton capacity', 7500),
  ('Mobile Crane MC-50', 'Mobile Crane', '50 ton capacity, extends to 60m', 5000);

-- Create function to safely get user metadata
CREATE OR REPLACE FUNCTION get_user_metadata(user_id uuid)
RETURNS jsonb AS $$
BEGIN
  RETURN (
    SELECT raw_user_meta_data
    FROM auth.users
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert operators for existing users
DO $$ 
DECLARE 
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT 
      id,
      email,
      get_user_metadata(id) as metadata
    FROM auth.users 
    WHERE get_user_metadata(id)->>'role' = 'operator'
  LOOP
    INSERT INTO public.operators (
      user_id,
      name,
      email,
      phone,
      specialization
    ) VALUES (
      user_record.id,
      user_record.metadata->>'name',
      user_record.email,
      '+1234567890',
      'Tower Crane'
    );
  END LOOP;
END $$;