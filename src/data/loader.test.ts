import { describe, it, expect } from 'vitest';
import { normalizeLeadTimes } from './loader';
import { calculateBwb } from '../engine/bwb';
import { Facility } from '../types';

describe('normalizeLeadTimes', () => {
  it('memetakan kolom lead_times.csv ke format mesin BWB', () => {
    const [lt] = normalizeLeadTimes([
      { sumber_daya: 'tt_isolasi', persiapan: 'Tempat tidur isolasi di RS darurat', lt_min_hari: 5, lt_max_hari: 11, dasar: 'x', label: 'BERSUMBER' },
    ]);
    expect(lt).toMatchObject({ lead_time_min_hari: 5, lead_time_max_hari: 11, status_data: 'BERSUMBER' });
  });

  it('BWB TT isolasi menghasilkan tanggal valid (bukan NaN)', () => {
    const lts = normalizeLeadTimes([{ persiapan: 'Tempat tidur isolasi di RS darurat', lt_min_hari: 5, lt_max_hari: 11 }]);
    const f = { kode_rs: '1', nama: 'X', kode_wilayah: '3171', tipe: '', lat: -6.2, lon: 106.8, tempat_tidur: 100, tt_isolasi: 20, tt_icu: 4 } as Facility;
    const iso = calculateBwb(f, lts, '2021-06-10').find((b) => b.sumberDaya === 'TT Isolasi')!;
    expect(iso.bwbMin).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(iso.bwbMin).toBe('2021-06-12'); // 10 Jun + (13 − 11)
  });
});
