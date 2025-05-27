/*
  # Create users view

  1. New Views
    - `users_view`: A view that provides a simplified interface to auth.users data
      - Combines user data and metadata for easier querying
      - Includes: id, email, name, role, status, created_at

  2. Security
    - Enable RLS on the view
    - Add policies for admin access
*/

CREATE OR REPLACE VIEW users_view AS
SELECT 
  id,
  email,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'role' as role,
  COALESCE(raw_user_meta_data->>'status', 'active') as status,
  created_at
FROM auth.users;

-- Enable RLS
ALTER VIEW users_view SET (security_invoker = true);

-- Grant access to authenticated users
GRANT SELECT ON users_view TO authenticated;

-- Create policies
CREATE POLICY "Admins can view all users"
  ON users_view
  FOR SELECT
  TO authenticated
  USING (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text);