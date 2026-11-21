import { describe, it, expect } from 'vitest';
import { normalizeRegions, withRobustCentroids, isValidJabodetabekCoord, haversineKm } from './geo';
import { Facility } from '../types';

const fac = (kode_wilayah: string, lat: number, lon: number): Facility =>
  ({ kode_rs: 'x', nama: 'x', kode_wilayah, tipe: 'A', lat, lon, tempat_tidur: 0 }) as Facility;

describe('geo helpers', () => {
  it('maps `kode` column to string kode_bps', () => {
    const [r] = normalizeRegions([{ kode: 3603, nama: 'Kab Tangerang', lat: -5.3, lon: 98.9, n_rs: 3 }]);
    expect(r.kode_bps).toBe('3603');
  });

  it('rejects 0,0 and out-of-area coordinates', () => {
    expect(isValidJabodetabekCoord(0, 0)).toBe(false);
    expect(isValidJabodetabekCoord(-2.41, 108.49)).toBe(false);
    expect(isValidJabodetabekCoord(-6.2, 106.8)).toBe(true);
  });

  it('uses median of valid facility coords, ignoring bad rows', () => {
    const [r] = normalizeRegions([{ kode: 3603, nama: 'Kab Tangerang', lat: -5.3, lon: 98.9, n_rs: 3 }]);
    const out = withRobustCentroids(
      [r],
      [fac('3603', 0, 0), fac('3603', -6.2, 106.5), fac('3603', -6.22, 106.52), fac('3603', -6.24, 106.54)]
    );
    expect(out[0].lat).toBeCloseTo(-6.22);
    expect(out[0].lon).toBeCloseTo(106.52);
  });

  it('keeps csv coords when no valid facility exists', () => {
    const [r] = normalizeRegions([{ kode: 1, nama: 'A', lat: -6.1, lon: 106.9, n_rs: 0 }]);
    expect(withRobustCentroids([r], [fac('1', 0, 0)])[0].lat).toBe(-6.1);
  });
});

describe('haversineKm', () => {
  it('Monas ke Bundaran HI ≈ 2 km', () => {
    expect(haversineKm(-6.1754, 106.8272, -6.1949, 106.823)).toBeGreaterThan(2);
    expect(haversineKm(-6.1754, 106.8272, -6.1949, 106.823)).toBeLessThan(2.4);
  });
});
