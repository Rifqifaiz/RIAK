import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { runBacktest, simulateDay, bwbWindow, statusPada, hariPeringatanPertama, DailyCaseRow } from './backtest2021';

const csv = fs.readFileSync(path.resolve(__dirname, '../../public/data/cases_2021_dki.csv'), 'utf8');
const cases: DailyCaseRow[] = csv
  .trim()
  .split('\n')
  .slice(1)
  .map((l) => {
    const [t, k] = l.split(',');
    return { tanggal: t.trim(), kasus: Number(k) || 0 };
  });

describe('Simulasi putar ulang 2021', () => {
  it('simulateDay(10 Jun) sama dengan runBacktest untuk tanggal penuh', () => {
    const sim = simulateDay(cases, '2021-06-10', '2021-05-01', '2021-07-31');
    const ref = runBacktest(cases).results['2021-06-10'];
    expect(sim.icuPenuh.cepat).toBe(ref.icuPenuh.cepat);
    expect(sim.icuPenuh.lambat).toBe(ref.icuPenuh.lambat);
    expect(sim.isolasiPenuh.cepat).toBe(ref.isolasiPenuh.cepat);
  });

  it('seri: data aktual sampai hari simulasi, proyeksi sesudahnya', () => {
    const sim = simulateDay(cases, '2021-06-10', '2021-06-01', '2021-06-20');
    const before = sim.series.find((p) => p.tanggal === '2021-06-10')!;
    const after = sim.series.find((p) => p.tanggal === '2021-06-11')!;
    expect(before.icuAktual).toBeGreaterThan(0);
    expect(before.icuTengah).toBeUndefined();
    expect(after.icuAktual).toBeUndefined();
    expect(after.icuBand![0]).toBeLessThanOrEqual(after.icuBand![1]);
  });

  it('SPEC §9.4: jendela & status BWB pada 10 Jun', () => {
    // TT isolasi tambahan: isolasi penuh 23–26 Jun, LT 5–11 → 12–21 Jun, SIAGA
    const iso = bwbWindow('2021-06-23', '2021-06-26', 5, 11);
    expect(iso).toEqual({ awal: '2021-06-12', akhir: '2021-06-21' });
    expect(statusPada('2021-06-10', iso)).toBe('SIAGA');
    // TT ICU tambahan: ICU penuh 22–25 Jun, LT 14–30 → 23 Mei–11 Jun, sebagian lewat
    const icu = bwbWindow('2021-06-22', '2021-06-25', 14, 30);
    expect(icu).toEqual({ awal: '2021-05-23', akhir: '2021-06-11' });
    expect(statusPada('2021-06-10', icu)).toBe('SIAGA_SEBAGIAN');
    // Oksigen impor: 22–25 Jun, LT 28–42 → 11–28 Mei, TERLEWAT
    const o2 = bwbWindow('2021-06-22', '2021-06-25', 28, 42);
    expect(o2).toEqual({ awal: '2021-05-11', akhir: '2021-05-28' });
    expect(statusPada('2021-06-10', o2)).toBe('TERLEWAT');
  });

  it('pita BWB grafik = ICU penuh − LT RS darurat (5–11) → 11–20 Jun', () => {
    expect(bwbWindow('2021-06-22', '2021-06-25', 5, 11)).toEqual({ awal: '2021-06-11', akhir: '2021-06-20' });
  });

  it('peringatan pertama TT isolasi muncul sebelum konversi RS darurat 5 Jul', () => {
    const d = hariPeringatanPertama(cases, '2021-05-15', '2021-07-10', 'isolasi', 5, 11);
    expect(d).not.toBeNull();
    expect(d! < '2021-07-05').toBe(true);
  });
});
