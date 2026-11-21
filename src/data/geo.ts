import { Region, Facility } from '../types';

/** Kotak batas kasar Jabodetabek. Koordinat RS di luar kotak ini dianggap salah input (mis. 0,0). */
export const JABODETABEK_BBOX = { latMin: -6.9, latMax: -5.9, lonMin: 106.3, lonMax: 107.4 };

export function isValidJabodetabekCoord(lat: unknown, lon: unknown): boolean {
  const la = Number(lat);
  const lo = Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return false;
  return (
    la >= JABODETABEK_BBOX.latMin &&
    la <= JABODETABEK_BBOX.latMax &&
    lo >= JABODETABEK_BBOX.lonMin &&
    lo <= JABODETABEK_BBOX.lonMax
  );
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** regions.csv memakai kolom `kode`; tipe Region memakai `kode_bps`. Samakan, dan kode selalu string. */
export function normalizeRegions(raw: Array<Record<string, unknown>>): Region[] {
  return raw.map((r) => ({
    ...(r as unknown as Region),
    kode_bps: String(r.kode_bps ?? r.kode ?? ''),
  }));
}

export function normalizeFacilities(raw: Facility[]): Facility[] {
  return raw.map((f) => ({ ...f, kode_rs: String(f.kode_rs), kode_wilayah: String(f.kode_wilayah) }));
}

/**
 * Titik tengah wilayah = median koordinat RS yang valid di wilayah itu.
 * Median tahan terhadap koordinat RS yang salah input; bila tidak ada RS valid,
 * pakai lat/lon dari regions.csv apa adanya.
 */
export function withRobustCentroids(regions: Region[], facilities: Facility[]): Region[] {
  return regions.map((r) => {
    const pts = facilities.filter(
      (f) => String(f.kode_wilayah) === r.kode_bps && isValidJabodetabekCoord(f.lat, f.lon)
    );
    if (pts.length === 0) return r;
    return { ...r, lat: median(pts.map((p) => Number(p.lat))), lon: median(pts.map((p) => Number(p.lon))) };
  });
}

/** Jarak dua titik (km), rumus haversine. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

/** Baris RS yang identik (kode & koordinat sama) hanya ditampilkan sekali di peta. */
export function uniqueFacilities<T extends { kode_rs: string; lat: number; lon: number }>(list: T[]): T[] {
  const seen = new Set<string>();
  return list.filter((f) => {
    const k = `${f.kode_rs}@${f.lat},${f.lon}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
