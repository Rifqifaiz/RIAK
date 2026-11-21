import { create } from 'zustand';

/**
 * Login SIMULASI untuk prototipe. Tidak ada backend: tidak ada data yang dikirim,
 * kata sandi tidak disimpan. Sesi hanya di sessionStorage (hilang saat tab ditutup).
 */

export interface SessionUser {
  nama: string;
  peran: string;
  demo: boolean;
}

const KEY = 'riak-sesi';

/** Akun demo yang ditampilkan terbuka di halaman login. */
export const DEMO_ACCOUNT = { id: 'demo', sandi: 'riak2026' };

export const isDemoCredential = (id: string, sandi: string) =>
  id.trim().toLowerCase() === DEMO_ACCOUNT.id && sandi === DEMO_ACCOUNT.sandi;

const DEMO_USER: SessionUser = { nama: 'Akun Demo', peran: 'Dinas Kesehatan (simulasi)', demo: true };

const read = (): SessionUser | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
};

interface AuthState {
  user: SessionUser | null;
  /** Mengembalikan true bila berhasil. */
  login: (id: string, sandi: string) => boolean;
  loginDemo: () => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => {
  const save = (u: SessionUser | null) => {
    try {
      if (u) sessionStorage.setItem(KEY, JSON.stringify(u));
      else sessionStorage.removeItem(KEY);
    } catch {
      /* mode privat: abaikan */
    }
    set({ user: u });
  };
  return {
    user: read(),
    login: (id, sandi) => {
      if (isDemoCredential(id, sandi)) {
        save(DEMO_USER);
        return true;
      }
      return false;
    },
    loginDemo: () => save(DEMO_USER),
    logout: () => save(null),
  };
});
