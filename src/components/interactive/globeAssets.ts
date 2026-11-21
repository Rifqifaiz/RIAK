/**
 * Membangun aset peta dunia untuk globe: tekstur, masker darat/Indonesia, dan titik daratan.
 * Dipakai di Web Worker (OffscreenCanvas) agar tidak membebani thread utama; ada jalur
 * cadangan di thread utama untuk browser tanpa OffscreenCanvas.
 */
import { geoEquirectangular, geoPath } from 'd3-geo';
import { feature, mesh } from 'topojson-client';

export const MASK_W = 1024;
export const MASK_H = 512;
const INDONESIA_ID = '360';

type Canvas2D = OffscreenCanvas | HTMLCanvasElement;
type Ctx2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

export interface GlobeAssets {
  /** Kanvas tekstur ekuirektangular. Bila `flipped`, gambar sudah dibalik vertikal (untuk ImageBitmap). */
  texture: Canvas2D;
  flipped: boolean;
  /** 1 byte per piksel masker: 0 laut, 1 darat, 2 Indonesia. */
  mask: Uint8Array;
  /** Posisi & warna titik daratan (xyz, rgb). */
  pos: Float32Array;
  col: Float32Array;
}

function latLonToXYZ(lat: number, lon: number, r: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [-(r * Math.sin(phi) * Math.cos(theta)), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
}

export async function buildGlobeAssets(
  texW: number,
  dotRadius: number,
  makeCanvas: (w: number, h: number) => Canvas2D,
  flip: boolean
): Promise<GlobeAssets> {
  const mod = await import('world-atlas/countries-50m.json');
  const world = (mod as any).default ?? mod;
  const countries = feature(world, world.objects.countries) as any;
  const borders = mesh(world, world.objects.countries, (a: any, b: any) => a !== b) as any;
  const indonesia = countries.features.find((f: any) => String(f.id) === INDONESIA_ID);

  // ---- Tekstur ----
  const texH = texW / 2;
  const tex = makeCanvas(texW, texH);
  const t = tex.getContext('2d') as Ctx2D;
  if (flip) {
    t.translate(0, texH);
    t.scale(1, -1);
  }
  const tPath = geoPath(geoEquirectangular().scale(texW / (2 * Math.PI)).translate([texW / 2, texH / 2]), t as any);
  const ocean = t.createLinearGradient(0, 0, 0, texH);
  ocean.addColorStop(0, '#0a1430');
  ocean.addColorStop(0.5, '#0b1838');
  ocean.addColorStop(1, '#0a1430');
  t.fillStyle = ocean;
  t.fillRect(0, 0, texW, texH);
  t.fillStyle = '#18306e';
  t.beginPath();
  tPath(countries);
  t.fill();
  t.strokeStyle = 'rgba(120,160,255,0.35)';
  t.lineWidth = texW / 2900;
  t.beginPath();
  tPath(borders);
  t.stroke();
  if (indonesia) {
    t.fillStyle = '#0f5f86';
    t.beginPath();
    tPath(indonesia);
    t.fill();
    t.strokeStyle = 'rgba(34,229,255,0.9)';
    t.lineWidth = texW / 1850;
    t.stroke();
  }

  // ---- Masker (R = darat, G = Indonesia) ----
  const mc = makeCanvas(MASK_W, MASK_H);
  const m = mc.getContext('2d', { willReadFrequently: true } as any) as Ctx2D;
  const mPath = geoPath(geoEquirectangular().scale(MASK_W / (2 * Math.PI)).translate([MASK_W / 2, MASK_H / 2]), m as any);
  m.fillStyle = '#000';
  m.fillRect(0, 0, MASK_W, MASK_H);
  m.fillStyle = '#f00';
  m.beginPath();
  mPath(countries);
  m.fill();
  if (indonesia) {
    m.fillStyle = '#ff0';
    m.beginPath();
    mPath(indonesia);
    m.fill();
  }
  const rgba = m.getImageData(0, 0, MASK_W, MASK_H).data;
  const mask = new Uint8Array(MASK_W * MASK_H);
  for (let i = 0; i < mask.length; i++) {
    mask[i] = rgba[i * 4 + 1] > 127 ? 2 : rgba[i * 4] > 127 ? 1 : 0;
  }

  // ---- Titik daratan (bola Fibonacci) ----
  const N = 26000;
  const pos: number[] = [];
  const col: number[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const lat = (Math.asin(y) * 180) / Math.PI;
    const lon = ((((i * golden * 180) / Math.PI) % 360) + 360) % 360 - 180;
    const x = Math.min(MASK_W - 1, Math.max(0, Math.floor(((lon + 180) / 360) * MASK_W)));
    const yy = Math.min(MASK_H - 1, Math.max(0, Math.floor(((90 - lat) / 180) * MASK_H)));
    const v = mask[yy * MASK_W + x];
    if (!v) continue;
    pos.push(...latLonToXYZ(lat, lon, dotRadius));
    if (v === 2) col.push(0.13, 0.9, 1);
    else col.push(0.45, 0.6, 1);
  }

  return { texture: tex, flipped: flip, mask, pos: new Float32Array(pos), col: new Float32Array(col) };
}
