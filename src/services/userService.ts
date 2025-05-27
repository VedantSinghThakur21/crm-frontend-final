import { User, UserRole } from '../types/auth';
import { supabase } from '../lib/supabaseClient';

export interface UserCreateInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface UserUpdateInput {
  name?: string;
  role?: UserRole;
  status?: 'active' | 'inactive';
}

// Get all users
export const getUsers = async (): Promise<User[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || user.user_metadata?.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('users_view')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }

  return data.map(user => ({
    id: user.id,
    name: user.name || user.email?.split('@')[0] || 'User',
    email: user.email,
    role: user.role as UserRole,
    status: user.status || 'active',
  }));
};

// Create user
export const createUser = async (input: UserCreateInput): Promise<User> => {
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  if (!currentUser || currentUser.user_metadata?.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase.functions.invoke('user-management', {
    body: JSON.stringify({
      action: 'create',
      email: input.email,
      password: input.password,
      name: input.name,
      role: input.role,
    }),
  });

  if (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }

  return {
    id: data.user.id,
    name: data.user.user_metadata.name,
    email: data.user.email,
    role: data.user.user_metadata.role,
    status: 'active',
  };
};

// Update user
export const updateUser = async (id: string, input: UserUpdateInput): Promise<User> => {
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  if (!currentUser || currentUser.user_metadata?.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase.functions.invoke('user-management', {
    body: JSON.stringify({
      action: 'update',
      userId: id,
      ...input,
    }),
  });

  if (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user');
  }

  return {
    id: data.user.id,
    name: data.user.user_metadata.name,
    email: data.user.email,
    role: data.user.user_metadata.role,
    status: input.status || 'active',
  };
};

// Delete user
export const deleteUser = async (id: string): Promise<void> => {
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  if (!currentUser || currentUser.user_metadata?.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase.functions.invoke('user-management', {
    body: JSON.stringify({
      action: 'delete',
      userId: id,
    }),
  });

  if (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
};

// Update user status
export const updateUserStatus = async (id: string, status: 'active' | 'inactive'): Promise<void> => {
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  if (!currentUser || currentUser.user_metadata?.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase.functions.invoke('user-management', {
    body: JSON.stringify({
      action: 'updateStatus',
      userId: id,
      status,
    }),
  });

  if (error) {
    console.error('Error updating user status:', error);
    throw new Error('Failed to update user status');
  }
};