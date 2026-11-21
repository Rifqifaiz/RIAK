import { create } from 'zustand';

export type Theme = 'dark' | 'light';
const KEY = 'riak-theme';

const initial = (): Theme =>
  typeof document !== 'undefined' && !document.documentElement.classList.contains('dark') ? 'light' : 'dark';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
}

/** Tema situs. Gelap adalah bawaan; pilihan disimpan di localStorage (bukan cookie). */
export const useTheme = create<ThemeState>((set, get) => ({
  theme: initial(),
  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* mode privat: abaikan */
    }
    set({ theme: next });
  },
}));
