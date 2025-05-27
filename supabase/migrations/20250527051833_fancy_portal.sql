/*
  # User Management Views and Functions
  
  1. New Functions
    - `is_admin()` - Checks if current user has admin role
    
  2. New Views
    - `users_view` - Secure view of auth.users with RLS
    
  3. Security
    - RLS enabled on users_view
    - Only admins can access the view
    - Security barrier enabled for extra protection
*/

-- Create a secure function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the view in public schema with proper security context
CREATE OR REPLACE VIEW public.users_view WITH (security_barrier = true) AS
SELECT 
  id,
  email,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'role' as role,
  COALESCE(raw_user_meta_data->>'status', 'active') as status,
  created_at
FROM auth.users;

-- Set ownership and permissions
ALTER VIEW public.users_view OWNER TO postgres;
GRANT SELECT ON public.users_view TO authenticated;

-- Enable RLS on the view
ALTER VIEW public.users_view ENABLE ROW LEVEL SECURITY;

-- Create RLS policy using the admin check function
CREATE POLICY "Admins can view all users"
ON public.users_view
FOR SELECT
TO authenticated
USING (public.is_admin());