import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, Sparkles, ShieldCheck, Globe2, Timer, Sun, Moon, Info, Loader2 } from 'lucide-react';
import { useAuth, DEMO_ACCOUNT, isDemoCredential } from '../components/common/auth';
import { useTheme } from '../components/common/theme';

interface LoginProps {
  onSuccess: () => void;
}

const POIN = [
  { icon: Globe2, text: 'Pantau wabah sejak masih di luar negeri' },
  { icon: Timer, text: 'Hitung Batas Waktu Bertindak tiap faskes' },
  { icon: ShieldCheck, text: 'Keputusan tetap pada pejabat berwenang' },
];

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const { login, loginDemo } = useAuth();
  const { theme, toggle } = useTheme();
  const [id, setId] = useState('');
  const [sandi, setSandi] = useState('');
  const [lihat, setLihat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'form' | 'demo' | null>(null);

  // Jeda singkat agar transisi ke animasi riak terasa halus
  const finish = (fn: () => void, kind: 'form' | 'demo') => {
    setBusy(kind);
    window.setTimeout(() => {
      fn();
      onSuccess();
    }, 450);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!id.trim() || !sandi) {
      setError('Isi ID pengguna dan kata sandi.');
      return;
    }
    if (isDemoCredential(id, sandi)) {
      finish(() => login(id, sandi), 'form');
    } else {
      setError('ID atau kata sandi salah. Untuk prototipe ini, gunakan akun demo.');
    }
  };

  const ThemeIcon = theme === 'dark' ? Sun : Moon;

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
      <button
        type="button"
        onClick={toggle}
        aria-label={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
        className="absolute right-4 top-4 rounded-xl border border-line bg-surface/80 p-2.5 text-ink-muted backdrop-blur transition hover:text-ink"
      >
        <ThemeIcon className="h-4 w-4" />
      </button>

      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-line bg-surface/80 shadow-elevated backdrop-blur-xl md:grid-cols-2 riak-fade-up">
        {/* Panel visual */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#0B1430] via-[#1E1B4B] to-[#3B0F33] p-10 text-white md:flex md:flex-col md:justify-between">
          <div className="pointer-events-none absolute -bottom-32 -right-32 h-[460px] w-[460px]">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="absolute inset-0 rounded-full border border-cyan-300/30 login-ring"
                style={{ animationDelay: `${i * 1.25}s` }}
              />
            ))}
            <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_30px_rgba(103,232,249,0.8)]" />
          </div>

          <div className="relative flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <span className="absolute h-10 w-10 rounded-full border border-cyan-300/40" />
              <span className="absolute h-6 w-6 rounded-full border border-cyan-300/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
            </div>
            <div>
              <div className="font-display text-2xl font-extrabold leading-none">RIAK</div>
              <div className="text-[11px] text-white/60">Radar Indikasi Awal Kedaruratan</div>
            </div>
          </div>

          <div className="relative space-y-6">
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight">
              Lihat riaknya,
              <br />
              <span className="bg-gradient-to-r from-cyan-300 to-pink-300 bg-clip-text text-transparent">cegah gelombangnya.</span>
            </h1>
            <ul className="space-y-3">
              {POIN.map((p) => (
                <li key={p.text} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                    <p.icon className="h-4 w-4 text-cyan-300" />
                  </span>
                  {p.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative text-[11px] text-white/45">The 10th Open Innovation 2026 · IMERI FKUI · Universitas Indonesia</div>
        </div>

        {/* Formulir */}
        <div className="p-7 sm:p-10">
          <div className="mb-8 md:hidden">
            <div className="font-display text-3xl font-extrabold text-ink">RIAK</div>
            <div className="text-xs text-ink-muted">Radar Indikasi Awal Kedaruratan</div>
          </div>

          <h2 className="font-display text-2xl font-bold text-ink">Masuk</h2>
          <p className="mt-1 text-sm text-ink-muted">Untuk pejabat dan manajemen fasilitas kesehatan.</p>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            <label className="block">
              <span className="text-xs font-semibold text-ink-muted">ID pengguna</span>
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                autoComplete="username"
                placeholder="mis. demo"
                className="mt-1.5 w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink-muted">Kata sandi</span>
              <div className="relative mt-1.5">
                <input
                  type={lihat ? 'text' : 'password'}
                  value={sandi}
                  onChange={(e) => setSandi(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 pr-11 text-sm text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                />
                <button
                  type="button"
                  onClick={() => setLihat(!lihat)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-muted hover:text-ink"
                  aria-label={lihat ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {lihat ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {error && (
              <p role="alert" className="rounded-xl border border-status-terlewat/30 bg-status-terlewat-bg px-3 py-2 text-xs text-status-terlewat">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy !== null}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-blue/90 disabled:opacity-70"
            >
              {busy === 'form' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Masuk
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            <span className="h-px flex-1 bg-line" /> atau <span className="h-px flex-1 bg-line" />
          </div>

          <button
            type="button"
            onClick={() => finish(loginDemo, 'demo')}
            disabled={busy !== null}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-3.5 text-sm font-bold text-white shadow-glass transition hover:brightness-110 disabled:opacity-70"
          >
            {busy === 'demo' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Coba akun demo
          </button>
          <p className="mt-2 text-center text-[11px] text-ink-muted">
            atau masuk manual: ID <code className="font-mono font-bold text-ink">{DEMO_ACCOUNT.id}</code> · sandi{' '}
            <code className="font-mono font-bold text-ink">{DEMO_ACCOUNT.sandi}</code>
          </p>

          <div className="mt-7 flex gap-2 rounded-xl bg-surface-2 p-3 text-[11px] leading-relaxed text-ink-muted">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-blue" />
            <span>
              Prototipe: login ini simulasi di peramban. Tidak ada data yang dikirim ke server dan kata sandi tidak disimpan.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
