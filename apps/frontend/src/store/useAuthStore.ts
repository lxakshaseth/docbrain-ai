import { create } from 'zustand';
import { IUser } from '@pdf-chatbot/shared';

interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthModalOpen: boolean;
  setAuth: (user: IUser, token: string) => void;
  logout: () => void;
  setAuthModalOpen: (open: boolean) => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthModalOpen: false,

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

  setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),

  initAuth: () => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        set({ token: storedToken });
      }
    }
  },
}));
