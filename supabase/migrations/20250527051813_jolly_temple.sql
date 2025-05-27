/*
  # Create users view and admin check function

  1. New Objects
    - `auth.is_admin()` function to check admin role
    - `auth.users_view` view for secure user data access
  
  2. Security
    - Enable RLS on view
    - Add policy for admin access
    - Set proper permissions and ownership
*/

-- Create a secure function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the view in auth schema with proper security context
CREATE OR REPLACE VIEW auth.users_view WITH (security_barrier = true) AS
SELECT 
  id,
  email,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'role' as role,
  COALESCE(raw_user_meta_data->>'status', 'active') as status,
  created_at
FROM auth.users;

-- Set ownership and permissions
ALTER VIEW auth.users_view OWNER TO postgres;
GRANT SELECT ON auth.users_view TO authenticated;

-- Enable RLS on the view
ALTER VIEW auth.users_view ENABLE ROW LEVEL SECURITY;

-- Create RLS policy using the admin check function
CREATE POLICY "Admins can view all users"
ON auth.users_view
FOR SELECT
TO authenticated
USING (auth.is_admin());