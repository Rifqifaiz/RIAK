export interface DailyCaseRow {
  tanggal: string; // YYYY-MM-DD
  kasus: number;
}

export interface CutoffResult {
  cutoff: string;
  waktuGandakan: number; // doubling time in days
  g: number;
  icuPenuh: {
    lambat: string;
    tengah: string;
    cepat: string;
  };
  isolasiPenuh: {
    lambat: string;
    tengah: string;
    cepat: string;
  };
}

export interface HistoricalObsPoint {
  tanggal: string;
  isolasi: number;
  icu: number;
}

export const OBS_2021: Record<string, HistoricalObsPoint> = {
  '2021-05-31': { tanggal: '2021-05-31', isolasi: 2176, icu: 362 },
  '2021-06-14': { tanggal: '2021-06-14', isolasi: 5752, icu: 773 },
  '2021-06-23': { tanggal: '2021-06-23', isolasi: 8874, icu: 1048 },
  '2021-07-18': { tanggal: '2021-07-18', isolasi: 10016, icu: 1447 },
};

export const CAP_31_MEI = {
  isolasi: 6621,
  icu: 1014,
};

function parseDate(dStr: string): Date {
  const [y, m, d] = dStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(dStr: string, days: number): string {
  const d = parseDate(dStr);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDate(d);
}

// ---------------------------------------------------------------------------
// Inti model (dipakai bersama oleh runBacktest dan simulasi harian)
// ---------------------------------------------------------------------------

type Speed = 'lambat' | 'tengah' | 'cepat';
const SPEEDS: Array<{ name: Speed; pow: number }> = [
  { name: 'lambat', pow: 0.85 },
  { name: 'tengah', pow: 1 },
  { name: 'cepat', pow: 1.15 },
];

function makeCaseMap(cases: DailyCaseRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const c of [...cases].sort((a, b) => a.tanggal.localeCompare(b.tanggal))) m.set(c.tanggal, c.kasus);
  return m;
}

function k7(map: Map<string, number>, d: string): number {
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += map.get(addDays(d, -i)) ?? 0;
  return sum / 7;
}

function l14(map: Map<string, number>, d: string): number {
  let sum = 0;
  for (let i = 0; i < 14; i++) sum += map.get(addDays(d, -i)) ?? 0;
  return sum;
}

export function calibrate(cases: DailyCaseRow[]) {
  const map = makeCaseMap(cases);
  const load31Mei = l14(map, '2021-05-31');
  return {
    map,
    load31Mei,
    kI: OBS_2021['2021-05-31'].isolasi / load31Mei,
    kC: OBS_2021['2021-05-31'].icu / load31Mei,
  };
}

interface CoreResult {
  g: number;
  waktuGandakan: number; // Infinity bila kasus tidak naik
  sims: Record<Speed, Map<string, number>>;
  icu: Record<Speed, string>;
  iso: Record<Speed, string>;
}

/** SPEC §9.2 langkah 3–5 untuk satu tanggal data terakhir. */
function cutoffCore(map: Map<string, number>, kI: number, kC: number, cutoff: string, horizon = 60): CoreResult {
  const k7c = k7(map, cutoff);
  const k7p = k7(map, addDays(cutoff, -7));
  const g = k7p > 0 ? Math.pow(k7c / k7p, 1 / 7) : 1;
  const waktuGandakan = g > 1 ? Math.log(2) / Math.log(g) : Infinity;

  const sims = {} as Record<Speed, Map<string, number>>;
  const icu = {} as Record<Speed, string>;
  const iso = {} as Record<Speed, string>;
  for (const { name, pow } of SPEEDS) {
    const rate = Math.pow(g, pow);
    const sim = new Map<string, number>(map);
    for (let h = 1; h <= horizon; h++) sim.set(addDays(cutoff, h), k7c * Math.pow(rate, h));
    sims[name] = sim;
    let dIcu = '';
    let dIso = '';
    for (let h = 1; h <= 60; h++) {
      const d = addDays(cutoff, h);
      const L = l14(sim, d);
      if (!dIso && L * kI > CAP_31_MEI.isolasi) dIso = d;
      if (!dIcu && L * kC > CAP_31_MEI.icu) dIcu = d;
      if (dIcu && dIso) break;
    }
    icu[name] = dIcu;
    iso[name] = dIso;
  }
  return { g, waktuGandakan, sims, icu, iso };
}

export function runBacktest(cases: DailyCaseRow[]): {
  kI: number;
  kC: number;
  load31Mei: number;
  results: Record<string, CutoffResult>;
} {
  const { map, kI, kC, load31Mei } = calibrate(cases);
  const results: Record<string, CutoffResult> = {};
  for (const cutoff of ['2021-06-07', '2021-06-10', '2021-06-14', '2021-06-17']) {
    const r = cutoffCore(map, kI, kC, cutoff);
    results[cutoff] = {
      cutoff,
      waktuGandakan: Number(r.waktuGandakan.toFixed(1)),
      g: r.g,
      icuPenuh: { lambat: r.icu.lambat, tengah: r.icu.tengah, cepat: r.icu.cepat },
      isolasiPenuh: { lambat: r.iso.lambat, tengah: r.iso.tengah, cepat: r.iso.cepat },
    };
  }
  return { kI, kC, load31Mei, results };
}

// ---------------------------------------------------------------------------
// Simulasi putar ulang (halaman Studi Kasus)
// ---------------------------------------------------------------------------

export interface SimPoint {
  tanggal: string;
  /** Kasus harian nyata (hanya sampai tanggal simulasi). */
  kasus?: number;
  /** Beban proksi dari kasus nyata (L14 × k), sampai tanggal simulasi. */
  icuAktual?: number;
  isoAktual?: number;
  /** Beban proksi dari kasus nyata SETELAH tanggal simulasi (pembanding "kenyataan"). */
  icuKenyataan?: number;
  isoKenyataan?: number;
  /** Proyeksi setelah tanggal simulasi. */
  icuTengah?: number;
  isoTengah?: number;
  icuBand?: [number, number];
  isoBand?: [number, number];
}

export interface SimDay {
  tanggal: string;
  kasusHarian: number;
  rata7: number;
  g: number;
  waktuGandakan: number;
  icuPenuh: Record<Speed, string>;
  isolasiPenuh: Record<Speed, string>;
  series: SimPoint[];
}

/** Proyeksi model seolah-olah "hari ini" = `tanggal` (data hanya sampai tanggal itu). */
export function simulateDay(cases: DailyCaseRow[], tanggal: string, from: string, to: string): SimDay {
  const { map, kI, kC } = calibrate(cases);
  const horizon = Math.max(60, diffDays(tanggal, to));
  const r = cutoffCore(map, kI, kC, tanggal, horizon);
  const series: SimPoint[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (d <= tanggal) {
      const L = l14(map, d);
      series.push({ tanggal: d, kasus: map.get(d), icuAktual: Math.round(L * kC), isoAktual: Math.round(L * kI) });
    } else {
      const Lr = l14(map, d);
      const lo = l14(r.sims.lambat, d);
      const mid = l14(r.sims.tengah, d);
      const hi = l14(r.sims.cepat, d);
      series.push({
        tanggal: d,
        icuKenyataan: map.has(d) ? Math.round(Lr * kC) : undefined,
        isoKenyataan: map.has(d) ? Math.round(Lr * kI) : undefined,
        icuTengah: Math.round(mid * kC),
        isoTengah: Math.round(mid * kI),
        icuBand: [Math.round(lo * kC), Math.round(hi * kC)],
        isoBand: [Math.round(lo * kI), Math.round(hi * kI)],
      });
    }
  }
  return {
    tanggal,
    kasusHarian: map.get(tanggal) ?? 0,
    rata7: k7(map, tanggal),
    g: r.g,
    waktuGandakan: r.waktuGandakan,
    icuPenuh: r.icu,
    isolasiPenuh: r.iso,
    series,
  };
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);
}

export { addDays as tambahHari };

/** Jendela BWB = [penuh_cepat − LT_max, penuh_lambat − LT_min] (SPEC §9.4, C = 0). */
export function bwbWindow(penuhCepat: string, penuhLambat: string, ltMin: number, ltMax: number, cadangan = 0) {
  if (!penuhCepat || !penuhLambat) return null;
  return { awal: addDays(penuhCepat, -ltMax - cadangan), akhir: addDays(penuhLambat, -ltMin - cadangan) };
}

/** Status BWB pada tanggal `hariIni` (SPEC §8.7: Aman > 14 hari, Siaga 0–14, Terlewat < 0). */
export function statusPada(hariIni: string, w: { awal: string; akhir: string } | null): 'AMAN' | 'SIAGA' | 'SIAGA_SEBAGIAN' | 'TERLEWAT' {
  if (!w) return 'AMAN';
  if (hariIni > w.akhir) return 'TERLEWAT';
  if (hariIni > w.awal) return 'SIAGA_SEBAGIAN';
  return diffDays(hariIni, w.awal) <= 14 ? 'SIAGA' : 'AMAN';
}

/**
 * Hari pertama (dalam rentang) ketika model, dengan data sampai hari itu,
 * memberi status selain AMAN untuk sebuah persiapan.
 */
export function hariPeringatanPertama(
  cases: DailyCaseRow[],
  from: string,
  to: string,
  sumber: 'icu' | 'isolasi',
  ltMin: number,
  ltMax: number
): string | null {
  const { map, kI, kC } = calibrate(cases);
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const r = cutoffCore(map, kI, kC, d);
    const p = sumber === 'icu' ? r.icu : r.iso;
    const st = statusPada(d, bwbWindow(p.cepat, p.lambat, ltMin, ltMax));
    if (st !== 'AMAN') return d;
  }
  return null;
}
