/*
  # Create initial users and auth configuration
  
  1. New Users
    - Creates admin user
    - Creates sales agent user
    - Creates operations manager user
    - Creates operator user
    
  2. Authentication
    - Sets up email/password authentication
    - Creates corresponding identities for each user
    - Confirms email addresses
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create auth.users for initial setup
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES
  -- Admin User
  (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    'admin@aspcranes.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "admin", "name": "Admin User", "avatar": "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  -- Sales Agent
  (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    'john@aspcranes.com',
    crypt('sales123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "sales_agent", "name": "John Sales", "avatar": "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  -- Operations Manager
  (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    'sara@aspcranes.com',
    crypt('manager123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "operations_manager", "name": "Sara Manager", "avatar": "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  -- Operator
  (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    'mike@aspcranes.com',
    crypt('operator123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "operator", "name": "Mike Operator", "avatar": "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

-- Create identities for users
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT 
  id,
  id,
  email,  -- Using email as provider_id
  json_build_object('sub', id::text, 'email', email),
  'email',
  NOW(),
  NOW(),
  NOW()
FROM auth.users;