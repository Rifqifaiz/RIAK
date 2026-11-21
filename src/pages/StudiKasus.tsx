import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, ReferenceArea,
} from 'recharts';
import { AlertCircle, Download, CheckCircle2, Play, Pause, RotateCcw, Gauge, CalendarDays, Radio, Siren, Gavel, Activity, Eye, EyeOff } from 'lucide-react';
import {
  runBacktest, simulateDay, bwbWindow, statusPada, diffDays, tambahHari, DailyCaseRow, CAP_31_MEI,
} from '../engine/backtest2021';
import { fetchCsv, fetchJson, normalizeLeadTimes } from '../data/loader';
import { LeadTime } from '../types';
import { SectionTag, StatTile, GradientCard } from '../components/common/CommonUi';
import { Angka } from '../components/common/Angka';
import { StatusBadge } from '../components/common/StatusBadge';

// Rentang simulasi & grafik
const SIM_START = '2021-05-15';
const SIM_END = '2021-07-20';
const CHART_FROM = '2021-05-01';
const CHART_TO = '2021-07-31';
const CUTOFFS = ['2021-06-07', '2021-06-10', '2021-06-14', '2021-06-17'];

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const tgl = (iso: string) => {
  if (!iso) return '–';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${BULAN[m - 1]}${y !== 2021 ? ` ${y}` : ''}`;
};
const tglPanjang = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${BULAN[m - 1]} ${y}`;
};
const rentang = (a: string, b: string) => (!a || !b ? 'tidak dalam 60 hari' : a === b ? tgl(a) : `${tgl(a)} – ${tgl(b)}`);
const angka = (n: number) => Math.round(n).toLocaleString('id-ID');

interface Event {
  tanggal: string;
  jenis: 'sinyal_luar' | 'lokal' | 'riak' | 'krisis' | 'keputusan';
  teks: string;
}
interface BorRow {
  tanggal: string;
  terisi_isolasi?: number;
  terisi_icu?: number;
}

const EVENT_STYLE: Record<Event['jenis'], { label: string; cls: string; Icon: React.FC<{ className?: string }> }> = {
  sinyal_luar: { label: 'Sinyal luar negeri', cls: 'bg-brand-blue-50 text-brand-blue', Icon: Radio },
  lokal: { label: 'Data lokal', cls: 'bg-surface-2 text-ink-muted', Icon: Activity },
  riak: { label: 'RIAK', cls: 'bg-brand-pink-50 text-brand-pink', Icon: Gauge },
  krisis: { label: 'Krisis', cls: 'bg-status-terlewat-bg text-status-terlewat', Icon: Siren },
  keputusan: { label: 'Keputusan', cls: 'bg-status-aman-bg text-status-aman', Icon: Gavel },
};

/** Persiapan yang dihitung di simulasi (SPEC §9.4). */
const PERSIAPAN = [
  { key: 'iso', nama: 'TT isolasi tambahan (RS darurat)', cari: 'Tempat tidur isolasi', basis: 'isolasi' as const },
  { key: 'icu', nama: 'TT ICU tambahan', cari: 'Tempat tidur ICU', basis: 'icu' as const },
  { key: 'o2', nama: 'Oksigen dari pemasok internasional', cari: 'pemasok internasional', basis: 'icu' as const },
];

export const StudiKasus: React.FC = () => {
  const [cases, setCases] = useState<DailyCaseRow[]>([]);
  const [bor, setBor] = useState<BorRow[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [leadTimes, setLeadTimes] = useState<LeadTime[]>([]);
  const [loading, setLoading] = useState(true);

  const [simDate, setSimDate] = useState('2021-06-10');
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(4); // hari per detik
  const [tab, setTab] = useState<'icu' | 'isolasi'>('icu');
  const [showReality, setShowReality] = useState(true);
  const timer = useRef<number>();

  useEffect(() => {
    Promise.all([
      fetchCsv<{ tanggal: string; kasus: number }>('./data/cases_2021_dki.csv'),
      fetchCsv<BorRow>('./data/bor_obs_2021_dki.csv'),
      fetchJson<Event>('./data/events_2021.json'),
      fetchCsv<Record<string, any>>('./data/lead_times.csv').then(normalizeLeadTimes),
    ]).then(([c, b, e, lt]) => {
      setCases(c.map((d) => ({ tanggal: String(d.tanggal), kasus: Number(d.kasus) || 0 })));
      setBor(b.map((r) => ({ ...r, tanggal: String(r.tanggal) })));
      setEvents(e);
      setLeadTimes(lt);
      setLoading(false);
    });
  }, []);

  // Putar ulang: maju satu hari per tick
  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      setSimDate((d) => {
        if (d >= SIM_END) {
          setPlaying(false);
          return d;
        }
        return tambahHari(d, 1);
      });
    }, 1000 / speed);
    return () => window.clearInterval(timer.current);
  }, [playing, speed]);

  const backtest = useMemo(() => (cases.length ? runBacktest(cases) : null), [cases]);
  const sim = useMemo(() => (cases.length ? simulateDay(cases, simDate, CHART_FROM, CHART_TO) : null), [cases, simDate]);

  const lt = (cari: string) => leadTimes.find((l) => l.persiapan.toLowerCase().includes(cari.toLowerCase()));
  const ltRsDarurat = lt('Tempat tidur isolasi');

  if (loading || !sim || !backtest) {
    return <div className="flex h-64 items-center justify-center text-ink-muted">Memuat data kasus DKI Jakarta 2021…</div>;
  }

  // ---- Data grafik ----
  const borMap = new Map(bor.map((r) => [r.tanggal, r]));
  const chartData = sim.series.map((p) => {
    const o = borMap.get(p.tanggal);
    const visibleObs = o && p.tanggal <= simDate;
    return {
      ...p,
      obsIcu: visibleObs && o?.terisi_icu ? Number(o.terisi_icu) : undefined,
      obsIso: visibleObs && o?.terisi_isolasi ? Number(o.terisi_isolasi) : undefined,
      icuKenyataan: showReality ? p.icuKenyataan : undefined,
      isoKenyataan: showReality ? p.isoKenyataan : undefined,
    };
  });
  const isIcu = tab === 'icu';
  const cap = isIcu ? CAP_31_MEI.icu : CAP_31_MEI.isolasi;
  // Sumbu Y menyesuaikan beban yang sudah terlihat, agar garis tidak "keluar" grafik
  const visibleMax = Math.max(
    0,
    ...chartData.map((p) => Math.max((isIcu ? p.icuAktual : p.isoAktual) ?? 0, (isIcu ? p.obsIcu : p.obsIso) ?? 0))
  );
  const step = isIcu ? 250 : 1500;
  const yMax = Math.min(cap * 4, Math.max(cap * 2, Math.ceil((visibleMax * 1.15) / step) * step));
  const bebanHariIni = (isIcu ? sim.series.find((p) => p.tanggal === simDate)?.icuAktual : sim.series.find((p) => p.tanggal === simDate)?.isoAktual) ?? 0;
  const sudahLewat = bebanHariIni > cap;
  const penuh = isIcu ? sim.icuPenuh : sim.isolasiPenuh;
  // Pita BWB grafik = tanggal penuh − waktu tunggu TT RS darurat (catatan SPEC §9.4)
  const pita = ltRsDarurat ? bwbWindow(penuh.cepat, penuh.lambat, ltRsDarurat.lead_time_min_hari, ltRsDarurat.lead_time_max_hari) : null;
  const clamp = (d: string) => (d < CHART_FROM ? CHART_FROM : d > CHART_TO ? CHART_TO : d);

  // ---- Kartu BWB hari ini ----
  const kartu = PERSIAPAN.map((p) => {
    const l = lt(p.cari);
    const pen = p.basis === 'icu' ? sim.icuPenuh : sim.isolasiPenuh;
    const w = l ? bwbWindow(pen.cepat, pen.lambat, l.lead_time_min_hari, l.lead_time_max_hari) : null;
    const st = statusPada(simDate, w);
    let hitung = 'Model belum memproyeksikan penuh dalam 60 hari';
    if (w) {
      if (st === 'TERLEWAT') hitung = `Terlewat ${diffDays(w.akhir, simDate)} hari`;
      else if (st === 'SIAGA_SEBAGIAN') hitung = `Sisa ${diffDays(simDate, w.akhir)} hari sebelum BWB akhir`;
      else hitung = `Mulai bertindak dalam ${diffDays(simDate, w.awal)} hari`;
    }
    return { ...p, l, w, st, hitung };
  });

  // ---- Tabel 9.4 (data sampai 10 Juni) ----
  const r10 = backtest.results['2021-06-10'];
  const tabel94 = PERSIAPAN.map((p) => {
    const l = lt(p.cari);
    const pen = p.basis === 'icu' ? r10.icuPenuh : r10.isolasiPenuh;
    const w = l ? bwbWindow(pen.cepat, pen.lambat, l.lead_time_min_hari, l.lead_time_max_hari) : null;
    return { ...p, l, pen, w, st: statusPada('2021-06-10', w) };
  });

  const pastEvents = events.filter((e) => e.tanggal <= simDate).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const progress = Math.max(0, Math.min(1, diffDays(SIM_START, simDate) / diffDays(SIM_START, SIM_END)));

  return (
    <div className="mx-auto max-w-[1200px] space-y-8 px-4 py-8">
      {/* Judul */}
      <div>
        <SectionTag>VALIDASI RETROSPEKTIF</SectionTag>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">Studi Kasus 2021 — Gelombang Delta DKI Jakarta</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
          Putar ulang Mei–Juli 2021 hari demi hari. Pada setiap tanggal, model hanya memakai data yang sudah tersedia saat itu,
          lalu memproyeksikan kapan tempat tidur penuh dan kapan paling lambat harus bertindak.
        </p>
        <div className="mt-4 h-0.5 w-full rounded-full bg-brand-gradient" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatTile
          title="Selisih tanggal faskes penuh"
          value={<Angka nilai="1–4" format="angka" status="KALIBRASI" sumber="Uji retrospektif DKI 2021" />}
          subtext="Proyeksi ICU penuh 22–25 Jun vs kenyataan ~21 Jun"
          accentColor="bg-status-aman"
        />
        <StatTile
          title="Peringatan lebih awal"
          value={<Angka nilai="11–15" format="hari" status="KALIBRASI" sumber="10 Juni ke 21–25 Juni" />}
          subtext="Dari 10 Jun sampai kapasitas 31 Mei (1.014 ICU) terlampaui"
          accentColor="bg-brand-blue"
        />
        <StatTile
          title="Kesenjangan keputusan"
          value={<Angka nilai="15–24" format="hari" status="KALIBRASI" sumber="BWB 11–20 Jun vs RS darurat 5 Jul" />}
          subtext="Antara BWB RIAK dan mulai konversi RS darurat (5 Jul)"
          accentColor="bg-brand-pink"
        />
      </div>

      {/* ================= Simulasi ================= */}
      <GradientCard hoverEffect={false} className="!p-0 overflow-hidden">
        {/* Kontrol */}
        <div className="flex flex-col gap-4 border-b border-line p-5 md:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-brand-pink">Simulasi putar ulang</div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <CalendarDays className="h-5 w-5 self-center text-brand-blue" />
              <span className="font-display text-2xl font-extrabold text-ink tabular-nums">{tglPanjang(simDate)}</span>
              <span className="text-xs text-ink-muted">= “hari ini” bagi model</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (!playing && simDate >= SIM_END) setSimDate(SIM_START);
                setPlaying(!playing);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-blue/90"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? 'Jeda' : simDate >= SIM_END ? 'Putar lagi' : 'Putar'}
            </button>
            <button
              onClick={() => {
                setPlaying(false);
                setSimDate(SIM_START);
              }}
              className="rounded-xl border border-line bg-surface-2 p-2.5 text-ink-muted hover:text-ink"
              aria-label="Ulang dari awal"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <div className="flex overflow-hidden rounded-xl border border-line">
              {[2, 4, 8].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-3 py-2 font-mono text-xs font-bold ${speed === s ? 'bg-brand-blue text-white' : 'bg-surface-2 text-ink-muted hover:text-ink'}`}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Slider & lompat cepat */}
        <div className="space-y-3 border-b border-line px-5 py-4 md:px-6">
          <input
            type="range"
            min={0}
            max={diffDays(SIM_START, SIM_END)}
            value={diffDays(SIM_START, simDate)}
            onChange={(e) => {
              setPlaying(false);
              setSimDate(tambahHari(SIM_START, Number(e.target.value)));
            }}
            className="w-full cursor-pointer"
            style={{ background: `linear-gradient(to right, #7FA2FF ${progress * 100}%, rgb(var(--c-line)) ${progress * 100}%)` }}
            aria-label="Tanggal simulasi"
          />
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-ink-muted">Lompat ke tanggal uji:</span>
            {CUTOFFS.map((d) => (
              <button
                key={d}
                onClick={() => {
                  setPlaying(false);
                  setSimDate(d);
                }}
                className={`rounded-lg px-2.5 py-1 font-mono font-semibold transition ${
                  simDate === d ? 'bg-brand-blue text-white' : 'bg-surface-2 text-ink-muted hover:text-ink'
                }`}
              >
                {tgl(d)}
                {d === '2021-06-10' ? ' (acuan)' : ''}
              </button>
            ))}
            <span className="ml-auto hidden text-ink-muted md:inline">
              {tgl(SIM_START)} → {tgl(SIM_END)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Grafik */}
          <div className="p-5 md:p-6 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-4">
                {(['icu', 'isolasi'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`border-b-2 pb-1.5 text-xs font-bold transition ${
                      tab === t ? 'border-brand-blue text-brand-blue' : 'border-transparent text-ink-muted hover:text-ink'
                    }`}
                  >
                    {t === 'icu' ? `Pasien ICU (kapasitas ${angka(CAP_31_MEI.icu)})` : `Pasien isolasi (kapasitas ${angka(CAP_31_MEI.isolasi)})`}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowReality(!showReality)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-[11px] font-semibold text-ink-muted hover:text-ink"
              >
                {showReality ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                Kenyataan sesudahnya
              </button>
            </div>

            <div className="mt-3 h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 18, right: 12, left: -6, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3E7EF" vertical={false} />
                  <XAxis dataKey="tanggal" tickFormatter={tgl} stroke="#5B6475" fontSize={11} interval={9} />
                  <YAxis stroke="#5B6475" fontSize={11} domain={[0, yMax]} allowDataOverflow tickFormatter={(v) => angka(v)} width={52} />
                  <Tooltip
                    labelFormatter={(l) => tglPanjang(String(l))}
                    formatter={(v: any, name: string) => [Array.isArray(v) ? `${angka(v[0])} – ${angka(v[1])}` : angka(v), name]}
                    contentStyle={{ backgroundColor: '#14213D', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12 }}
                    itemStyle={{ color: '#E6EBF5' }}
                  />
                  {pita && (
                    <ReferenceArea
                      x1={clamp(pita.awal)}
                      x2={clamp(pita.akhir)}
                      fill="#B45309"
                      fillOpacity={0.16}
                      stroke="#B45309"
                      strokeOpacity={0.4}
                      label={{ value: 'Pita BWB', position: 'insideTop', fill: '#B45309', fontSize: 11 }}
                    />
                  )}
                  <ReferenceLine y={cap} stroke="#B91C1C" strokeDasharray="5 4" label={{ value: 'Kapasitas 31 Mei', fill: '#B91C1C', fontSize: 11, position: 'insideTopLeft' }} />
                  {simDate >= '2021-06-21' && (
                    <ReferenceLine x="2021-06-21" stroke="#B91C1C" strokeOpacity={0.5} label={{ value: 'ICU lewat kapasitas', fill: '#B91C1C', fontSize: 10, position: 'insideBottomLeft', angle: -90 }} />
                  )}
                  {simDate >= '2021-07-05' && (
                    <ReferenceLine x="2021-07-05" stroke="#0F766E" strokeOpacity={0.6} label={{ value: 'Konversi RS darurat', fill: '#0F766E', fontSize: 10, position: 'insideBottomLeft', angle: -90 }} />
                  )}
                  <Area
                    dataKey={isIcu ? 'icuBand' : 'isoBand'}
                    name="Rentang proyeksi (lambat–cepat)"
                    stroke="none"
                    fill="#1E3A8A"
                    fillOpacity={0.2}
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                  <Line dataKey={isIcu ? 'icuTengah' : 'isoTengah'} name="Proyeksi (tengah)" stroke="#1E3A8A" strokeWidth={2.2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
                  <Line dataKey={isIcu ? 'icuKenyataan' : 'isoKenyataan'} name="Kenyataan sesudahnya (proksi)" stroke="#BE185D" strokeOpacity={0.35} strokeWidth={1.6} strokeDasharray="2 3" dot={false} isAnimationActive={false} />
                  <Line dataKey={isIcu ? 'icuAktual' : 'isoAktual'} name="Beban dari kasus nyata (proksi)" stroke="#BE185D" strokeWidth={2.6} dot={false} isAnimationActive={false} />
                  <Line
                    dataKey={isIcu ? 'obsIcu' : 'obsIso'}
                    name="Keterisian nyata (rilis Pemprov)"
                    stroke="none"
                    dot={{ r: 5, fill: '#0F766E', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={false}
                  />
                  <ReferenceLine x={simDate} stroke="#7C3AED" strokeWidth={2} label={{ value: 'Hari ini', fill: '#7C3AED', fontSize: 11, position: 'top' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Legenda */}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-ink-muted">
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 rounded bg-[#BE185D]" />Beban dari kasus nyata</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 border-t-2 border-dashed border-[#1E3A8A] dark:border-[#7FA2FF]" />Proyeksi model</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded-sm bg-[#1E3A8A]/20 dark:bg-[#7FA2FF]/25" />Rentang lambat–cepat</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#0F766E] ring-2 ring-white dark:ring-surface" />Keterisian nyata</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded-sm bg-[#B45309]/25" />Pita BWB</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 bg-[#7C3AED]" />Hari ini</span>
            </div>

            {/* Linimasa kejadian */}
            <div className="mt-5">
              <div className="relative h-10">
                <div className="absolute left-0 right-0 top-4 h-1 rounded-full bg-line" />
                <div className="absolute left-0 top-4 h-1 rounded-full bg-brand-gradient transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
                {events
                  .filter((e) => e.tanggal >= SIM_START && e.tanggal <= SIM_END)
                  .map((e) => {
                    const x = diffDays(SIM_START, e.tanggal) / diffDays(SIM_START, SIM_END);
                    const done = e.tanggal <= simDate;
                    const S = EVENT_STYLE[e.jenis];
                    return (
                      <button
                        key={e.tanggal + e.teks}
                        onClick={() => {
                          setPlaying(false);
                          setSimDate(e.tanggal);
                        }}
                        title={`${tglPanjang(e.tanggal)} — ${e.teks}`}
                        className={`absolute top-1.5 h-6 w-6 -translate-x-1/2 rounded-full border-2 transition ${
                          done ? 'scale-100 border-white shadow-md' : 'scale-75 border-line opacity-60'
                        } ${S.cls}`}
                        style={{ left: `${x * 100}%` }}
                      >
                        <S.Icon className="mx-auto h-3 w-3" />
                      </button>
                    );
                  })}
              </div>
              <div className="flex justify-between text-[10px] text-ink-muted">
                <span>{tgl(SIM_START)}</span>
                <span>Klik penanda untuk lompat ke kejadian</span>
                <span>{tgl(SIM_END)}</span>
              </div>
            </div>
          </div>

          {/* Panel kondisi hari ini */}
          <div className="space-y-4 border-t border-line bg-surface-2/60 p-5 md:p-6 lg:border-l lg:border-t-0">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-line bg-surface p-3">
                <div className="text-[10px] text-ink-muted">Kasus harian DKI</div>
                <div className="font-mono text-lg font-extrabold text-ink">
                  <Angka nilai={sim.kasusHarian} status="BERSUMBER" sumber="INACOVID, kasus harian DKI" />
                </div>
              </div>
              <div className="rounded-xl border border-line bg-surface p-3">
                <div className="text-[10px] text-ink-muted">Rata-rata 7 hari</div>
                <div className="font-mono text-lg font-extrabold text-ink">
                  <Angka nilai={Math.round(sim.rata7)} status="BERSUMBER" sumber="Dihitung dari kasus harian INACOVID" />
                </div>
              </div>
              <div className="col-span-2 rounded-xl border border-line bg-surface p-3">
                <div className="text-[10px] text-ink-muted">Waktu gandakan kasus</div>
                <div className="font-mono text-lg font-extrabold text-ink">
                  {Number.isFinite(sim.waktuGandakan) ? (
                    <Angka nilai={Number(sim.waktuGandakan.toFixed(1))} format="hari" status="KALIBRASI" sumber="g = (k7 hari ini / k7 seminggu lalu)^(1/7)" />
                  ) : (
                    <span className="text-sm text-status-aman">kasus tidak naik</span>
                  )}
                </div>
                <div className="mt-1 text-[11px] text-ink-muted">
                  {sudahLewat ? (
                    <b className="text-status-terlewat">Beban {isIcu ? 'ICU' : 'isolasi'} sudah melewati kapasitas 31 Mei</b>
                  ) : (
                    <>
                      Proyeksi {isIcu ? 'ICU' : 'isolasi'} penuh: <b className="text-ink">{rentang(penuh.cepat, penuh.lambat)}</b>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-bold text-ink">Batas Waktu Bertindak, dilihat dari hari ini</div>
              <div className="space-y-2">
                {kartu.map((k) => (
                  <div key={k.key} className="rounded-xl border border-line bg-surface p-3 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-semibold leading-snug text-ink">{k.nama}</div>
                      <StatusBadge
                        status={k.st}
                        customLabel={k.st === 'AMAN' ? 'Aman' : k.st === 'SIAGA' ? 'Siaga' : k.st === 'SIAGA_SEBAGIAN' ? 'Sebagian lewat' : 'Terlewat'}
                      />
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-ink-muted">
                      {k.w ? `BWB ${tgl(k.w.awal)} – ${tgl(k.w.akhir)}` : 'BWB –'} · waktu tunggu {k.l ? `${k.l.lead_time_min_hari}–${k.l.lead_time_max_hari} hari` : '–'}
                    </div>
                    <div className="mt-0.5 text-[11px] font-semibold text-ink">{k.hitung}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-bold text-ink">Yang sudah terjadi</div>
              <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                {pastEvents.length === 0 && <li className="text-[11px] text-ink-muted">Belum ada kejadian.</li>}
                {pastEvents.map((e) => {
                  const S = EVENT_STYLE[e.jenis];
                  const baru = diffDays(e.tanggal, simDate) <= 2;
                  return (
                    <li key={e.tanggal + e.teks} className={`flex gap-2 rounded-lg p-2 text-[11px] ${baru ? 'riak-fade-up bg-surface ring-1 ring-brand-blue/30' : ''}`}>
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${S.cls}`}>
                        <S.Icon className="h-3 w-3" />
                      </span>
                      <span>
                        <span className="font-mono font-bold text-ink">{tgl(e.tanggal)}</span>{' '}
                        <span className="text-ink-muted">{e.teks}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </GradientCard>

      {/* Narasi wajib SPEC §9.4 */}
      <div className="rounded-2xl border border-brand-blue-100 bg-brand-blue-50 p-5 text-sm leading-relaxed text-ink">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-brand-blue">Kesimpulan uji (data sampai 10 Juni)</p>
        <p>
          Dengan data sampai 10 Juni, proyeksi ICU penuh (22–25 Juni) berselisih 1–4 hari dari kenyataan (~21 Juni), memberi peringatan 11–15 hari.
          BWB penambahan tempat tidur jatuh pada 11–20 Juni, sedangkan konversi RS darurat dimulai 5 Juli: kesenjangan keputusan 15–24 hari.
          Oksigen impor sudah terlewat pada 10 Juni, sehingga harus dipicu dari RADAR (Delta di Indonesia sejak 3 Mei).
        </p>
      </div>

      {/* Tabel 9.3 */}
      <GradientCard hoverEffect={false}>
        <h3 className="mb-4 font-display text-lg font-bold text-ink">Hasil 4 tanggal uji</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-ink-muted">
                <th className="px-3 py-2.5">Data sampai</th>
                <th className="px-3 py-2.5">Waktu gandakan</th>
                <th className="px-3 py-2.5">ICU penuh (cepat–lambat)</th>
                <th className="px-3 py-2.5">Isolasi penuh (cepat–lambat)</th>
                <th className="px-3 py-2.5">Kenyataan</th>
                <th className="px-3 py-2.5 text-center">Tes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {Object.entries(backtest.results).map(([d, r]) => (
                <tr
                  key={d}
                  onClick={() => setSimDate(d)}
                  className={`cursor-pointer transition hover:bg-surface-2 ${d === simDate ? 'bg-brand-blue-50/60 font-medium' : ''}`}
                >
                  <td className="px-3 py-2.5 font-mono font-bold text-ink">{tglPanjang(d)}</td>
                  <td className="px-3 py-2.5 font-mono">{r.waktuGandakan.toLocaleString('id-ID')} hari</td>
                  <td className="px-3 py-2.5 font-mono">{rentang(r.icuPenuh.cepat, r.icuPenuh.lambat)}</td>
                  <td className="px-3 py-2.5 font-mono">{rentang(r.isolasiPenuh.cepat, r.isolasiPenuh.lambat)}</td>
                  <td className="px-3 py-2.5 text-ink-muted">ICU ~21 Jun; isolasi ~16 Jun</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-status-aman">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Lulus
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-ink-muted">Klik baris untuk melihatnya di simulasi.</p>
      </GradientCard>

      {/* Tabel 9.4 */}
      <GradientCard hoverEffect={false}>
        <h3 className="mb-4 font-display text-lg font-bold text-ink">Contoh BWB (data sampai 10 Juni, cadangan aman 0)</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-ink-muted">
                <th className="px-3 py-2.5">Persiapan</th>
                <th className="px-3 py-2.5">Perkiraan penuh</th>
                <th className="px-3 py-2.5">Waktu tunggu</th>
                <th className="px-3 py-2.5">BWB</th>
                <th className="px-3 py-2.5">Status 10 Jun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tabel94.map((r) => (
                <tr key={r.key}>
                  <td className="px-3 py-2.5 font-semibold text-ink">
                    {r.nama}
                    {r.key === 'icu' && <sup className="text-ink-muted"> *</sup>}
                  </td>
                  <td className="px-3 py-2.5 font-mono">
                    {rentang(r.pen.cepat, r.pen.lambat)}
                    {r.key === 'o2' && <sup className="text-ink-muted"> **</sup>}
                  </td>
                  <td className="px-3 py-2.5 font-mono">{r.l ? `${r.l.lead_time_min_hari}–${r.l.lead_time_max_hari} hari` : '–'}</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-brand-blue">{r.w ? `${tgl(r.w.awal)} – ${tgl(r.w.akhir)}` : '–'}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={r.st} customLabel={r.st === 'SIAGA_SEBAGIAN' ? 'Siaga → sebagian lewat' : r.st === 'TERLEWAT' ? 'Terlewat' : r.st === 'SIAGA' ? 'Siaga' : 'Aman'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
          * Asumsi yang perlu divalidasi. ** Penyederhanaan: kebutuhan oksigen diasumsikan melampaui pasokan rutin bersamaan dengan penuhnya tempat tidur.
          Pita BWB di grafik = tanggal penuh dikurangi waktu tunggu TT RS darurat (5–11 hari) → 11–20 Juni.
        </p>
      </GradientCard>

      {/* Keterbatasan SPEC §9.5 */}
      <div className="rounded-2xl border-2 border-status-siaga/30 bg-status-siaga-bg/40 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-status-siaga" />
          <div className="text-xs leading-relaxed text-ink">
            <h4 className="mb-1 text-sm font-bold text-status-siaga">Keterbatasan studi (wajib transparan)</h4>
            <p>
              "Uji ini memakai satu wilayah, proksi beban sederhana (kasus 14 hari), empat titik data keterisian, dan dilakukan setelah kejadian. Data sampai 7 Juni menghasilkan proyeksi terlalu lambat; tempat tidur isolasi diremehkan sekitar seminggu. Ini bukti kelayakan konsep, bukan validasi akhir."
            </p>
          </div>
        </div>
      </div>

      {/* Unduhan */}
      <div className="flex flex-wrap gap-2">
        {[
          ['./downloads/backtest_2021.py', 'backtest_2021.py'],
          ['./data/cases_2021_dki.csv', 'Kasus harian DKI (CSV)'],
          ['./data/bor_obs_2021_dki.csv', 'Keterisian RS DKI (CSV)'],
          ['./data/events_2021.json', 'Linimasa kejadian (JSON)'],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            download
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink transition hover:border-brand-blue/40"
          >
            <Download className="h-3.5 w-3.5 text-brand-blue" /> {label}
          </a>
        ))}
      </div>
    </div>
  );
};
