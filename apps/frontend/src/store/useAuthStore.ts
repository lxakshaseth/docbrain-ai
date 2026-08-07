import { create } from 'zustand';
import type { IUser } from '@pdf-chatbot/shared';

interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  setAuth: (user: IUser, token: string) => void;
  logout: () => void;
  setAuthModalOpen: (open: boolean, mode?: 'login' | 'register') => void;
  setAuthModalMode: (mode: 'login' | 'register') => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthModalOpen: false,
  authModalMode: 'login',

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    set({ user, token, isAuthModalOpen: false });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    set({ user: null, token: null });
  },

  setAuthModalOpen: (open, mode = 'login') => set({ isAuthModalOpen: open, authModalMode: mode }),
  
  setAuthModalMode: (mode) => set({ authModalMode: mode }),

  initAuth: () => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        set({ token: storedToken });
      }
    }
  },
}));
