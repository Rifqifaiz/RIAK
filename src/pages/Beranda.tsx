import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionTag, StatTile } from '../components/common/CommonUi';
import { Angka } from '../components/common/Angka';
import { GlobeToMap } from '../components/interactive/GlobeToMap';
import { Reveal, TiltCard } from '../components/common/Reveal';
import {
  IlluRadar, IlluPeta, IlluRespons, IlluLatihan, IlluSimulator, IlluStudiKasus, IlluMetodologi,
} from '../components/common/Illustrations';
import {
  ArrowRight, Activity, Map, ShieldAlert, GraduationCap, Play, Sparkles, Link2, Database, UserCheck, FileCheck2, Check,
} from 'lucide-react';

interface BerandaProps {
  onReplaySplash?: () => void;
  /** true selama animasi pembuka diputar → globe menunda pekerjaan berat */
  introPlaying?: boolean;
}

const STEPS = [
  {
    key: 'radar',
    name: 'RADAR',
    phase: 'Fase −1 · wabah di luar negeri',
    question: 'Kapan & lewat mana penyakit masuk?',
    features: ['Umpan wabah global WHO', 'Kartu profil patogen', 'Pintu masuk prioritas', 'Jam pra-kedatangan'],
    to: '/radar',
    icon: Activity,
    Illu: IlluRadar,
  },
  {
    key: 'riak',
    name: 'PETA RIAK',
    phase: 'Fase 0–2 · kasus pertama sampai minggu 3+',
    question: 'Ke mana & secepat apa menyebar?',
    features: ['Peta 13 kab/kota Jabodetabek', 'Kalibrasi harian', 'Rentang ketidakpastian P10–P90'],
    to: '/peta',
    icon: Map,
    Illu: IlluPeta,
  },
  {
    key: 'respons',
    name: 'RESPONS',
    phase: 'Semua fase',
    question: 'Apa yang disiapkan, di mana, sampai kapan?',
    features: ['Hitung mundur per faskes', 'Batas Waktu Bertindak (BWB)', 'Pinjam antarfaskes', 'Daftar kesiapsiagaan'],
    to: '/respons',
    icon: ShieldAlert,
    Illu: IlluRespons,
  },
  {
    key: 'latihan',
    name: 'LATIHAN',
    phase: 'Masa damai',
    question: 'Seberapa siap kita sebelum terjadi?',
    features: ['Latihan tabletop dengan skenario', 'Evaluasi kesiapan tim'],
    to: '/latihan',
    icon: GraduationCap,
    Illu: IlluLatihan,
  },
];

const MORE = [
  { title: 'Simulator Opsi', desc: 'Bandingkan dampak opsi pembatasan pada hari puncak.', to: '/simulator', Illu: IlluSimulator },
  { title: 'Studi Kasus 2021', desc: 'Uji retrospektif gelombang Delta di DKI Jakarta.', to: '/studi-kasus-2021', Illu: IlluStudiKasus },
  { title: 'Metodologi', desc: 'Rumus, asumsi, dan label sumber setiap angka.', to: '/metodologi', Illu: IlluMetodologi },
];

const PRINSIP = [
  { icon: Link2, label: 'Penghubung, bukan pengganti' },
  { icon: Database, label: 'Data agregat saja' },
  { icon: UserCheck, label: 'Keputusan oleh pejabat' },
  { icon: FileCheck2, label: 'Setiap angka bersumber' },
];

export const Beranda: React.FC<BerandaProps> = ({ onReplaySplash, introPlaying = false }) => {
  const [step, setStep] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setStep((s) => (s + 1) % STEPS.length), 6000);
    return () => window.clearInterval(id);
  }, [autoplay]);

  const current = STEPS[step];

  return (
    <div className="relative z-10 pb-16">
      {/* Hero + globe: latar menyatu dengan halaman (tanpa batas tegas saat di-scroll) */}
      <section className="hero-band relative overflow-hidden px-4 pt-10 pb-12">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full border border-brand-blue/10 dark:border-white/10 animate-ripple" />
        <div className="pointer-events-none absolute -top-20 left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full border border-brand-blue/10 dark:border-white/10 animate-ripple" style={{ animationDelay: '2s' }} />

        <div className="relative mx-auto flex max-w-[1240px] flex-col items-center gap-5 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/70 px-3.5 py-1 text-xs font-medium text-ink backdrop-blur-md dark:border-white/20 dark:bg-white/10 dark:text-cyan-100">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              THE 10TH OPEN INNOVATION 2026 · IMERI FKUI
            </span>
            {onReplaySplash && (
              <button
                onClick={onReplaySplash}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/70 px-3 py-1 text-xs font-semibold text-brand-pink backdrop-blur-md transition hover:bg-surface dark:border-white/20 dark:bg-white/5 dark:text-pink-200 dark:hover:bg-white/10"
              >
                <Play className="h-3 w-3 fill-current" /> Putar animasi riak
              </button>
            )}
          </div>

          <div className="max-w-3xl space-y-3">
            <h1 className="font-display text-6xl md:text-7xl font-extrabold tracking-tight text-ink dark:text-white">RIAK</h1>
            <p className="font-display text-xl md:text-2xl font-bold bg-gradient-to-r from-brand-blue via-[#5B2C7A] to-brand-pink bg-clip-text text-transparent dark:from-cyan-300 dark:via-blue-200 dark:to-pink-300">
              Radar Indikasi Awal Kedaruratan
            </p>
            <p className="mx-auto max-w-2xl text-sm md:text-base leading-relaxed text-ink-muted dark:text-white/75">
              Menghitung <strong className="font-semibold text-brand-blue dark:text-cyan-300">Batas Waktu Bertindak (BWB)</strong> setiap fasilitas kesehatan,
              sejak wabah masih di luar negeri.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/respons"
              className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-pink-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_25px_rgba(190,24,93,0.35)] transition hover:scale-105 active:scale-95"
            >
              Coba demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/studi-kasus-2021"
              className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface px-5 py-3.5 text-sm font-semibold text-ink shadow-card backdrop-blur-md transition hover:bg-surface-2 dark:border-white/20 dark:bg-white/10 dark:text-white dark:shadow-none dark:hover:bg-white/20"
            >
              Lihat bukti 2021
            </Link>
          </div>
        </div>

        <div className="relative mx-auto mt-8 max-w-[1240px] w-full">
          <GlobeToMap introPlaying={introPlaying} />
          <p className="mt-3 text-center text-xs text-ink-muted dark:text-white/50">Tim Universitas Indonesia · 2026</p>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] space-y-16 px-4 pt-12">
        {/* Bukti */}
        <section>
          <Reveal className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <SectionTag>BUKTI UJI 2021</SectionTag>
              <h2 className="mt-2 font-display text-2xl md:text-3xl font-bold text-ink">Diuji ulang pada gelombang Delta DKI</h2>
            </div>
            <Link to="/studi-kasus-2021" className="text-sm font-semibold text-brand-blue hover:underline">
              Lihat studi kasus →
            </Link>
          </Reveal>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                title: 'Selisih tanggal faskes penuh',
                value: <Angka nilai="1–4" format="angka" status="KALIBRASI" sumber="Uji retrospektif 2021" />,
                sub: 'Hari selisih proyeksi (22–25 Jun) vs kejadian (~21 Jun 2021)',
                accent: 'bg-status-aman',
              },
              {
                title: 'Peringatan lebih awal',
                value: <Angka nilai="11–15" format="hari" status="KALIBRASI" sumber="10 Jun ke 21–25 Jun" />,
                sub: 'Waktu bersiap sebelum kapasitas kritis terlampaui',
                accent: 'bg-brand-blue',
              },
              {
                title: 'Jeda keputusan',
                value: <Angka nilai="15–24" format="hari" status="KALIBRASI" sumber="BWB 11–20 Jun vs RS Darurat 5 Jul" />,
                sub: 'Antara BWB RIAK dan konversi RS darurat 5 Jul 2021',
                accent: 'bg-brand-pink',
              },
            ].map((s, i) => (
              <Reveal key={s.title} delay={i * 100} className="h-full [&>div]:h-full">
                <StatTile title={s.title} value={s.value} subtext={s.sub} accentColor={s.accent} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* Cara kerja: stepper interaktif */}
        <section>
          <Reveal className="mb-5">
            <SectionTag>CARA KERJA</SectionTag>
            <h2 className="mt-2 font-display text-2xl md:text-3xl font-bold text-ink">Empat modul, satu alur keputusan</h2>
          </Reveal>

          <Reveal>
            <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
              {/* Tab langkah */}
              <div className="grid grid-cols-2 md:grid-cols-4 border-b border-line">
                {STEPS.map((s, i) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      setStep(i);
                      setAutoplay(false);
                    }}
                    className={`relative flex items-center gap-2.5 px-4 py-4 text-left transition ${
                      i === step ? 'bg-brand-blue-50/60' : 'hover:bg-surface-2'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                        i === step ? 'bg-brand-gradient text-white shadow-glass' : 'bg-surface-2 text-ink-muted'
                      }`}
                    >
                      <s.icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-[10px] font-bold text-ink-muted">LANGKAH {i + 1}</span>
                      <span className={`block text-sm font-bold ${i === step ? 'text-brand-blue' : 'text-ink'}`}>{s.name}</span>
                    </span>
                    {i === step && (
                      <span className="absolute bottom-0 left-0 h-0.5 bg-brand-gradient" style={{ width: '100%' }}>
                        {autoplay && <span key={step} className="block h-full bg-white/60 origin-left animate-[progress_6s_linear]" />}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div key={current.key} className="grid grid-cols-1 md:grid-cols-2 riak-fade-up">
                <div className="aspect-[16/9] md:aspect-auto md:min-h-[300px]">
                  <current.Illu />
                </div>
                <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-pink">{current.phase}</span>
                  <h3 className="font-display text-2xl font-bold text-ink">“{current.question}”</h3>
                  <ul className="space-y-2">
                    {current.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-ink-muted">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-status-aman-bg text-status-aman">
                          <Check className="h-3 w-3" />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-3 pt-2">
                    <Link
                      to={current.to}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-blue/90"
                    >
                      Buka {current.name} <ArrowRight className="h-4 w-4" />
                    </Link>
                    {step < STEPS.length - 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setStep(step + 1);
                          setAutoplay(false);
                        }}
                        className="text-sm font-semibold text-ink-muted hover:text-ink"
                      >
                        Langkah berikutnya →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Rumus BWB */}
        <Reveal>
          <section className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#3B0F33] p-6 text-white shadow-xl md:flex-row md:p-8">
            <div className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-300">
                <Sparkles className="h-3.5 w-3.5" /> Rumus inti
              </span>
              <div className="font-mono text-xl md:text-2xl font-extrabold">BWB = Tanggal faskes penuh − Waktu tunggu</div>
              <p className="max-w-xl text-xs text-white/65">
                RIAK memberi tenggat, opsi, dan dampak; keputusan ada pada pejabat berwenang.
              </p>
            </div>
            <Link to="/metodologi" className="shrink-0 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-xs font-bold transition hover:bg-white/20">
              Pelajari metodologi →
            </Link>
          </section>
        </Reveal>

        {/* Jelajahi lainnya */}
        <section>
          <Reveal className="mb-5">
            <SectionTag>JELAJAHI</SectionTag>
            <h2 className="mt-2 font-display text-2xl md:text-3xl font-bold text-ink">Uji, bandingkan, pelajari</h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {MORE.map((m, i) => (
              <Reveal key={m.to} delay={i * 100} className="h-full">
                <TiltCard className="h-full">
                  <Link to={m.to} className="group block h-full overflow-hidden rounded-card border border-line bg-surface shadow-card transition hover:shadow-elevated">
                    <div className="aspect-[16/9] overflow-hidden">
                      <m.Illu className="transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="p-5">
                      <h3 className="flex items-center justify-between font-display text-lg font-bold text-ink group-hover:text-brand-blue">
                        {m.title}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </h3>
                      <p className="mt-1 text-sm text-ink-muted">{m.desc}</p>
                    </div>
                  </Link>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Prinsip */}
        <Reveal>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {PRINSIP.map((p) => (
              <div key={p.label} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue-50 text-brand-blue">
                  <p.icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-ink">{p.label}</span>
              </div>
            ))}
          </section>
        </Reveal>
      </div>
    </div>
  );
};
