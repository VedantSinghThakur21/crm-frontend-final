/*
  # Create secure users view with admin-only access
  
  1. New Functions
    - public.is_admin(): Checks if current user has admin role
    - public.check_is_admin(): Security barrier function for view
  
  2. Views
    - public.users_view: Secure view of auth.users with admin-only access
    
  3. Security
    - View uses security barrier and security definer functions
    - Only authenticated users with admin role can access the view
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

-- Create a security barrier function to enforce admin-only access
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS SETOF auth.users AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN QUERY SELECT * FROM auth.users;
  END IF;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the view using the security barrier function
CREATE OR REPLACE VIEW public.users_view WITH (security_barrier = true) AS
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'name' as name,
  u.raw_user_meta_data->>'role' as role,
  COALESCE(u.raw_user_meta_data->>'status', 'active') as status,
  u.created_at
FROM public.check_is_admin() u;

-- Grant access to authenticated users
GRANT SELECT ON public.users_view TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_admin TO authenticated;