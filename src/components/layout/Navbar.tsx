import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity, Map, ShieldAlert, Sliders, LineChart, GraduationCap, BookOpen, Users,
  ChevronDown, Menu, X, Settings2, Sun, Moon, LogOut, LucideIcon,
} from 'lucide-react';
import { Logo } from '../common/CommonUi';
import { useTheme } from '../common/theme';
import { useAuth } from '../common/auth';

interface NavbarProps {
  currentScenario: string;
  onScenarioChange: (scenario: string) => void;
  simulationDate: string;
  onDateChange: (date: string) => void;
}

interface NavItem {
  label: string;
  to: string;
  desc: string;
  icon: LucideIcon;
  tag?: string;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    label: 'Pantau',
    items: [
      { label: 'RADAR', to: '/radar', desc: 'Wabah di luar negeri & perkiraan kedatangan', icon: Activity, tag: 'Fase −1' },
      { label: 'Peta Riak', to: '/peta', desc: 'Penyebaran di 13 kab/kota Jabodetabek', icon: Map, tag: 'Fase 0–2' },
    ],
  },
  {
    label: 'Uji & Latih',
    items: [
      { label: 'Simulator', to: '/simulator', desc: 'Bandingkan opsi pembatasan sosial', icon: Sliders },
      { label: 'Studi Kasus 2021', to: '/studi-kasus-2021', desc: 'Uji retrospektif gelombang Delta DKI', icon: LineChart },
      { label: 'Latihan', to: '/latihan', desc: 'Latihan tabletop di masa damai', icon: GraduationCap },
    ],
  },
  {
    label: 'Info',
    items: [
      { label: 'Metodologi', to: '/metodologi', desc: 'Rumus, asumsi, dan sumber data', icon: BookOpen },
      { label: 'Tentang', to: '/tentang', desc: 'Tim, etika, dan batasan prototipe', icon: Users },
    ],
  },
];

const SCENARIOS: Record<string, string> = {
  'covid-delta': 'COVID-19 Delta (Acuan)',
  'disease-x-sedang': 'Disease X (FIKTIF)',
};

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const fmtTanggal = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return y && m && d ? `${d} ${BULAN[m - 1]} ${y}` : iso;
};

/** Menutup panel saat klik di luar atau tekan Esc. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);
  return ref;
}

const DropdownGroup: React.FC<{ group: NavGroup; open: boolean; setOpen: (v: boolean) => void }> = ({
  group,
  open,
  setOpen,
}) => {
  const { pathname } = useLocation();
  const active = group.items.some((i) => i.to === pathname);
  const timer = useRef<number>();
  const ref = useDismiss(open, () => setOpen(false));

  const enter = () => {
    window.clearTimeout(timer.current);
    setOpen(true);
  };
  const leave = () => {
    timer.current = window.setTimeout(() => setOpen(false), 140);
  };

  return (
    <div ref={ref} className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
          active ? 'text-brand-blue bg-brand-blue-50' : 'text-ink-muted hover:text-ink hover:bg-surface-2'
        }`}
      >
        {group.label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="dropdown-enter absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 rounded-2xl border border-line bg-surface p-2 shadow-elevated">
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `group flex items-start gap-3 rounded-xl p-3 transition ${isActive ? 'bg-brand-blue-50' : 'hover:bg-surface-2'}`
              }
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm transition group-hover:scale-105">
                <item.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-bold text-ink">
                  {item.label}
                  {item.tag && (
                    <span className="rounded-full bg-brand-pink-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-pink">{item.tag}</span>
                  )}
                </span>
                <span className="block text-xs text-ink-muted leading-snug">{item.desc}</span>
              </span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

export const Navbar: React.FC<NavbarProps> = ({ currentScenario, onScenarioChange, simulationDate, onDateChange }) => {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { pathname } = useLocation();
  const settingsRef = useDismiss(settingsOpen, () => setSettingsOpen(false));
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useDismiss(userOpen, () => setUserOpen(false));
  const inisial = (user?.nama ?? '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const ThemeIcon = theme === 'dark' ? Sun : Moon;
  const themeLabel = theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap';

  useEffect(() => {
    setOpenGroup(null);
    setMobileOpen(false);
    setSettingsOpen(false);
    setUserOpen(false);
  }, [pathname]);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `rounded-xl px-3 py-2 text-sm font-semibold transition ${
      isActive ? 'text-brand-blue bg-brand-blue-50' : 'text-ink-muted hover:text-ink hover:bg-surface-2'
    }`;

  return (
    <header className="sticky top-0 z-[1100] w-full border-b border-line/80 bg-surface/85 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-3 px-4 py-2.5">
        <NavLink to="/" className="rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue">
          <Logo />
        </NavLink>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Navigasi utama">
          <NavLink to="/" end className={linkCls}>Beranda</NavLink>
          {GROUPS.map((g) => (
            <DropdownGroup
              key={g.label}
              group={g}
              open={openGroup === g.label}
              setOpen={(v) => setOpenGroup(v ? g.label : null)}
            />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Pengaturan skenario: satu tombol ringkas */}
          <div ref={settingsRef} className="relative">
            <button
              type="button"
              onClick={() => setSettingsOpen(!settingsOpen)}
              aria-expanded={settingsOpen}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs font-semibold text-ink hover:border-brand-blue/40"
            >
              <Settings2 className="h-3.5 w-3.5 text-brand-blue" />
              <span className="max-w-[9rem] truncate">{SCENARIOS[currentScenario]?.split(' (')[0]}</span>
              <span className="font-mono text-ink-muted">{fmtTanggal(simulationDate)}</span>
            </button>
            {settingsOpen && (
              <div className="dropdown-enter absolute right-0 top-full z-50 mt-2 w-72 space-y-3 rounded-2xl border border-line bg-surface p-4 shadow-elevated">
                <label className="block text-xs font-semibold text-ink-muted">
                  Skenario patogen
                  <select
                    value={currentScenario}
                    onChange={(e) => onScenarioChange(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm font-semibold text-ink focus:border-brand-blue focus:outline-none"
                  >
                    {Object.entries(SCENARIOS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-ink-muted">
                  Tanggal simulasi
                  <input
                    type="date"
                    value={simulationDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-line bg-surface-2 px-3 py-2 font-mono text-sm font-bold text-ink focus:border-brand-blue focus:outline-none"
                  />
                </label>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggle}
            aria-label={themeLabel}
            title={themeLabel}
            className="rounded-xl border border-line bg-surface-2 p-2 text-ink-muted transition hover:text-ink hover:border-brand-blue/40"
          >
            <ThemeIcon className="h-4 w-4" />
          </button>

          <NavLink
            to="/respons"
            className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-bold text-white shadow-glass transition hover:brightness-110"
          >
            <ShieldAlert className="h-4 w-4" />
            RESPONS
          </NavLink>

          {/* Menu pengguna */}
          <div ref={userRef} className="relative">
            <button
              type="button"
              onClick={() => setUserOpen(!userOpen)}
              aria-expanded={userOpen}
              aria-label="Menu akun"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white shadow-glass ring-2 ring-surface transition hover:brightness-110"
            >
              {inisial}
            </button>
            {userOpen && user && (
              <div className="dropdown-enter absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-line bg-surface p-2 shadow-elevated">
                <div className="px-3 py-2.5">
                  <div className="text-sm font-bold text-ink">{user.nama}</div>
                  <div className="text-xs text-ink-muted">{user.peran}</div>
                  {user.demo && (
                    <span className="mt-1.5 inline-block rounded-full bg-brand-pink-50 px-2 py-0.5 text-[10px] font-bold text-brand-pink">MODE DEMO</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-muted transition hover:bg-surface-2 hover:text-ink"
                >
                  <LogOut className="h-4 w-4" /> Keluar
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden rounded-xl border border-line p-2 text-ink"
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Menu ponsel/tablet */}
      {mobileOpen && (
        <div className="dropdown-enter lg:hidden border-t border-line bg-surface px-4 pb-5 pt-3 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <NavLink to="/" end className="rounded-xl bg-surface-2 px-3 py-3 text-sm font-bold text-ink">Beranda</NavLink>
            <NavLink to="/respons" className="rounded-xl bg-brand-gradient px-3 py-3 text-sm font-bold text-white">RESPONS</NavLink>
          </div>
          {GROUPS.map((g) => (
            <div key={g.label} className="mb-3">
              <div className="px-1 pb-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted">{g.label}</div>
              {g.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `flex items-center gap-3 rounded-xl p-2.5 ${isActive ? 'bg-brand-blue-50' : ''}`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blue-50 text-brand-blue">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-ink">{item.label}</span>
                    <span className="block text-xs text-ink-muted">{item.desc}</span>
                  </span>
                </NavLink>
              ))}
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2 border-t border-line pt-3 sm:hidden">
            <select
              value={currentScenario}
              onChange={(e) => onScenarioChange(e.target.value)}
              className="rounded-xl border border-line bg-surface-2 px-2 py-2 text-xs font-semibold"
              aria-label="Pilih skenario patogen"
            >
              {Object.entries(SCENARIOS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <input
              type="date"
              value={simulationDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="rounded-xl border border-line bg-surface-2 px-2 py-2 font-mono text-xs"
              aria-label="Tanggal simulasi"
            />
          </div>
        </div>
      )}
    </header>
  );
};
