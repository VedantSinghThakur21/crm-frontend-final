import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User } from '../types/auth';
import { login, getUserFromToken } from '../services/authService';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      error: null,
      
      login: async (email: string, password: string) => {
        try {
          set({ error: null });
          const { token, user } = await login(email, password);
          set({ token, user, isAuthenticated: true });
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },
      
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false, error: null });
      },
      
      checkAuth: () => {
        const { token } = get();
        if (!token) return false;
        
        const user = getUserFromToken(token);
        if (!user) {
          set({ token: null, user: null, isAuthenticated: false });
          return false;
        }
        
        set({ user, isAuthenticated: true });
        return true;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);