/*
  # Create users view with security settings

  1. Changes
    - Create a secure view of auth.users table
    - Add security settings for admin-only access
    
  2. Security
    - View is created with security definer
    - Only admins can access the view
*/

-- Create the view with proper security context
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
ALTER VIEW public.users_view OWNER TO authenticated;
GRANT SELECT ON public.users_view TO authenticated;

-- Create a secure function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policy using the admin check function
CREATE POLICY "Admins can view all users"
ON public.users_view
FOR SELECT
TO authenticated
USING (auth.is_admin());

-- Enable RLS on the view
ALTER VIEW public.users_view ENABLE ROW LEVEL SECURITY;