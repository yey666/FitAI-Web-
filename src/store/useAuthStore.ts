import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  email: string;
  role?: 'admin' | 'user';
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  viewMode: 'admin' | 'user';
  login: (token: string, user: User) => void;
  logout: () => void;
  setAuth: (token: string, user: User) => void;
  toggleView: () => void;
  switchToAdminView: () => void;
  switchToUserView: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      viewMode: 'user',

      login: (token, user) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        const viewMode = user.role === 'admin' ? 'admin' : 'user';
        set({ token, user, isAuthenticated: true, viewMode });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ token: null, user: null, isAuthenticated: false, viewMode: 'user' });
      },

      setAuth: (token, user) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        const viewMode = user.role === 'admin' ? 'admin' : 'user';
        set({ token, user, isAuthenticated: true, viewMode });
      },

      toggleView: () => {
        const state = get();
        if (state.user?.role !== 'admin') return;
        set({ viewMode: state.viewMode === 'admin' ? 'user' : 'admin' });
      },

      switchToAdminView: () => {
        set({ viewMode: 'admin' });
      },

      switchToUserView: () => {
        set({ viewMode: 'user' });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);