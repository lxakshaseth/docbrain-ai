import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeState {
  theme: ThemeMode;
  effectiveTheme: 'dark' | 'light';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

const getSystemTheme = (): 'dark' | 'light' => {
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
};

const applyThemeClass = (effective: 'dark' | 'light') => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (effective === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',
  effectiveTheme: 'dark',

  setTheme: (theme: ThemeMode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
    const effective = theme === 'system' ? getSystemTheme() : theme;
    applyThemeClass(effective);
    set({ theme, effectiveTheme: effective });
  },

  toggleTheme: () => {
    const current = get().effectiveTheme;
    const next = current === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  initTheme: () => {
    if (typeof window === 'undefined') return;
    const savedTheme = (localStorage.getItem('theme') as ThemeMode) || 'dark';
    const effective = savedTheme === 'system' ? getSystemTheme() : savedTheme;
    applyThemeClass(effective);
    set({ theme: savedTheme, effectiveTheme: effective });

    // Listen for system preference changes if 'system' is selected
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (get().theme === 'system') {
        const newSystem = e.matches ? 'dark' : 'light';
        applyThemeClass(newSystem);
        set({ effectiveTheme: newSystem });
      }
    });
  },
}));
