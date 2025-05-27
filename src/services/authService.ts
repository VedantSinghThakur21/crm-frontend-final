import { User, UserRole } from '../types/auth';

// Mock user data
const MOCK_USERS = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@aspcranes.com',
    password: 'admin123',
    role: 'admin' as UserRole,
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
  {
    id: '2',
    name: 'John Sales',
    email: 'john@aspcranes.com',
    password: 'sales123',
    role: 'sales_agent' as UserRole,
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
  {
    id: '3',
    name: 'Sara Manager',
    email: 'sara@aspcranes.com',
    password: 'manager123',
    role: 'operations_manager' as UserRole,
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
  {
    id: '4',
    name: 'Mike Operator',
    email: 'mike@aspcranes.com',
    password: 'operator123',
    role: 'operator' as UserRole,
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
];

// Mock JWT token generation
const generateToken = (user: Omit<User, 'avatar'> & { avatar?: string }): string => {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours expiry
  };
  
  return btoa(JSON.stringify(payload));
};

// Login function
export const login = async (email: string, password: string): Promise<{ token: string; user: User }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Find user
  const user = MOCK_USERS.find(u => u.email === email && u.password === password);
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  // Generate token
  const token = generateToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
  
  // Return user info without password
  const { password: _, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword as User };
};

// Get user from token
export const getUserFromToken = (token: string): User | null => {
  try {
    const decoded = JSON.parse(atob(token));
    
    // Check if token is expired
    if (decoded.exp < Date.now()) {
      return null;
    }
    
    return {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      avatar: decoded.avatar,
    };
  } catch (error) {
    return null;
  }
};