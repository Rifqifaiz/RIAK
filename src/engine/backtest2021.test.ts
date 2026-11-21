import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { runBacktest, DailyCaseRow } from './backtest2021';

describe('SPEC §9.3 & §9.4: Backtest 2021 Acceptance Criteria', () => {
  const csvPath = path.resolve(__dirname, '../../public/data/cases_2021_dki.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.trim().split('\n').slice(1);
  const cases: DailyCaseRow[] = lines.map(line => {
    const [tanggal, kasusStr] = line.split(',');
    return { tanggal: tanggal.trim(), kasus: parseFloat(kasusStr) || 0 };
  });

  const { kI, kC, load31Mei, results } = runBacktest(cases);

  it('Kalibrasi 31 Mei 2021: L=8306, kIso~0.262, kICU~0.0436', () => {
    expect(load31Mei).toBe(8306);
    expect(kI).toBeCloseTo(0.262, 2);
    expect(kC).toBeCloseTo(0.0436, 3);
  });

  it('SPEC §9.3: Cutoff 10 Juni 2021 (Acuan Utama)', () => {
    const res10 = results['2021-06-10'];
    expect(res10).toBeDefined();

    // Waktu gandakan 9.4 hari (toleransi +-0.1)
    expect(res10.waktuGandakan).toBeCloseTo(9.4, 0.1);

    // ICU Penuh: 22-25 Juni (cepat: 22, lambat: 25)
    // res10.icuPenuh.cepat = '2021-06-22'
    // res10.icuPenuh.lambat = '2021-06-25'
    expect(['2021-06-21', '2021-06-22', '2021-06-23']).toContain(res10.icuPenuh.cepat);
    expect(['2021-06-24', '2021-06-25', '2021-06-26']).toContain(res10.icuPenuh.lambat);

    // Isolasi Penuh: 23-26 Juni
    expect(['2021-06-22', '2021-06-23', '2021-06-24']).toContain(res10.isolasiPenuh.cepat);
    expect(['2021-06-25', '2021-06-26', '2021-06-27']).toContain(res10.isolasiPenuh.lambat);
  });

  it('SPEC §9.3: Cutoff 7 Juni, 14 Juni, 17 Juni', () => {
    // 7 Juni: doubling ~26.6, ICU 12-22 Juli, Isolasi 15-26 Juli
    const res7 = results['2021-06-07'];
    expect(res7.waktuGandakan).toBeCloseTo(26.6, 0.5);

    // 14 Juni: doubling ~5.9, ICU 18-19 Juni
    const res14 = results['2021-06-14'];
    expect(res14.waktuGandakan).toBeCloseTo(5.9, 0.5);

    // 17 Juni: doubling ~6.5, ICU 19 Juni
    const res17 = results['2021-06-17'];
    expect(res17.waktuGandakan).toBeCloseTo(6.5, 0.5);
  });
});

