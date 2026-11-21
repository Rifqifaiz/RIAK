/** Data peta dunia (Natural Earth via world-atlas), dimuat sekali lalu di-cache. */
export const INDONESIA_ID = '360';

let p110: Promise<any> | null = null;
let p50: Promise<any> | null = null;

const unwrap = (m: any) => m?.default ?? m;

/** Resolusi kasar (±100 KB) — cukup untuk globe utuh, cepat digambar tiap frame. */
export const loadWorld110 = () => (p110 ??= import('world-atlas/countries-110m.json').then(unwrap));
/** Resolusi detail (±750 KB) — dipakai saat zoom dekat & garis batas Indonesia di peta. */
export const loadWorld50 = () => (p50 ??= import('world-atlas/countries-50m.json').then(unwrap));

/** Pusat & zoom tampilan Indonesia (dipakai globe dan peta agar sambungannya pas). */
export const INDONESIA_VIEW = { lat: -2.5, lon: 118, zoom: 5 };

/**
 * Skala proyeksi ortografis (px per radian) yang setara zoom Leaflet `z`:
 * 256·2^z px untuk 360° → 256·2^z / 2π px per radian. Di dekat ekuator Mercator ≈ ortografis,
 * jadi globe pada skala ini tampak sama dengan peta pada zoom tersebut.
 */
export const scaleForZoom = (z: number) => (256 * Math.pow(2, z)) / (2 * Math.PI);
