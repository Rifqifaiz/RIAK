/**
 * Gambar & tautan untuk detail faskes.
 *
 * - Citra satelit: Esri World Imagery (tanpa API key, wajib atribusi).
 * - Foto: Wikipedia/Wikimedia Commons, HANYA bila artikel cocok dengan nama faskes.
 * - Google Maps / Street View / Google Earth: tautan keluar (Google tidak mengizinkan
 *   gambarnya diambil langsung tanpa Maps Platform API).
 */

const R_MERC = 20037508.34;

function toMercator(lat: number, lon: number) {
  const x = (lon * R_MERC) / 180;
  const y = (Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180)) * (R_MERC / 180);
  return { x, y };
}

/** URL gambar satelit statis berpusat di titik, lebar cakupan ±`halfWidthM` meter. */
export function aerialImageUrl(lat: number, lon: number, w = 640, h = 360, halfWidthM = 140): string {
  const { x, y } = toMercator(lat, lon);
  // faktor skala Mercator agar cakupan ~meter sebenarnya
  const k = 1 / Math.cos((lat * Math.PI) / 180);
  const hw = halfWidthM * k;
  const hh = hw * (h / w);
  const bbox = [x - hw, y - hh, x + hw, y + hh].map((v) => v.toFixed(1)).join(',');
  const q = new URLSearchParams({ bbox, bboxSR: '3857', imageSR: '3857', size: `${w},${h}`, format: 'jpg', f: 'image' });
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?${q}`;
}

export const ESRI_ATTRIBUTION = 'Citra: Esri, Maxar, Earthstar Geographics, GIS User Community';

export function googleLinks(lat: number, lon: number, nama: string) {
  const ll = `${lat},${lon}`;
  return {
    maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${nama} ${ll}`)}`,
    streetView: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${ll}`,
    earth: `https://earth.google.com/web/@${lat},${lon},60a,600d,35y,0h,45t,0r`,
  };
}

// ---------- Pencocokan nama ----------

const GENERIC = new Set([
  'rs', 'rsu', 'rsud', 'rsup', 'rsupn', 'rsia', 'rsab', 'rsk', 'rskd', 'rskia', 'rsj', 'rsjd', 'rso', 'rspad', 'rsau', 'rsal', 'rsb', 'rsk', 'rsko', 'rspi',
  'rumah', 'sakit', 'umum', 'daerah', 'pusat', 'ibu', 'dan', 'anak', 'kota', 'kabupaten', 'kab',
  'puskesmas', 'pkm', 'kecamatan', 'kelurahan', 'upt', 'uptd', 'khusus', 'bersalin', 'hospital',
  'medical', 'center', 'centre', 'the', 'of', 'dr', 'h', 'st', 'santa', 'santo', 'islam', 'jakarta',
  'swasta', 'tipe', 'kelas', 'a', 'b', 'c', 'd', 'unit', 'pelaksana', 'teknis', 'dinas', 'kesehatan',
]);

export function nameTokens(s: string): string[] {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !GENERIC.has(t));
}

/** Judul artikel dianggap cocok bila judul menyebut jenis faskes dan memuat semua token khas nama. */
export function titleMatches(facilityName: string, title: string): boolean {
  const lt = title.toLowerCase();
  const isHealth = /(rumah sakit|\brs[a-z]*\b|puskesmas|hospital)/.test(lt);
  if (!isHealth) return false;
  const need = nameTokens(facilityName);
  if (need.length === 0) return false;
  const have = new Set(nameTokens(title));
  return need.every((t) => have.has(t));
}

// ---------- Foto Wikipedia ----------

export interface WikiPhoto {
  thumb: string;
  title: string;
  articleUrl: string;
  fileUrl?: string;
  extract?: string;
}

const cache = new Map<string, Promise<WikiPhoto | null>>();

interface WikiPage {
  title: string;
  thumbnail?: { source: string };
  pageimage?: string;
  extract?: string;
}

async function query(params: Record<string, string>): Promise<WikiPage[]> {
  const q = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    prop: 'pageimages|extracts',
    piprop: 'thumbnail|name',
    pithumbsize: '640',
    exintro: '1',
    explaintext: '1',
    exsentences: '2',
    exlimit: '20',
    ...params,
  });
  const res = await fetch(`https://id.wikipedia.org/w/api.php?${q}`);
  if (!res.ok) return [];
  const json = await res.json();
  return Object.values(json?.query?.pages ?? {}) as WikiPage[];
}

function toPhoto(p: WikiPage): WikiPhoto | null {
  if (!p.thumbnail?.source) return null;
  // Logo/lambang bukan foto gedung
  if (/(logo|lambang|emblem|seal|\.svg)/i.test(`${p.pageimage ?? ''} ${p.thumbnail.source}`)) return null;
  return {
    thumb: p.thumbnail.source,
    title: p.title,
    articleUrl: `https://id.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
    fileUrl: p.pageimage ? `https://id.wikipedia.org/wiki/Berkas:${encodeURIComponent(p.pageimage)}` : undefined,
    extract: p.extract,
  };
}

/** Cari foto asli faskes: artikel Wikipedia di dekat lokasi, lalu pencarian nama. */
export function fetchWikiPhoto(nama: string, lat: number, lon: number): Promise<WikiPhoto | null> {
  const key = `${nama}|${lat.toFixed(4)}|${lon.toFixed(4)}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      (async () => {
        try {
          const near = await query({
            generator: 'geosearch',
            ggscoord: `${lat}|${lon}`,
            ggsradius: '800',
            ggslimit: '20',
          });
          const hit = near.find((p) => titleMatches(nama, p.title) && toPhoto(p));
          if (hit) return toPhoto(hit);

          const tokens = nameTokens(nama);
          if (tokens.length === 0) return null;
          const found = await query({
            generator: 'search',
            gsrsearch: `${/puskesmas/i.test(nama) ? 'Puskesmas' : 'Rumah Sakit'} ${tokens.join(' ')}`,
            gsrlimit: '5',
          });
          const hit2 = found.find((p) => titleMatches(nama, p.title) && toPhoto(p));
          return hit2 ? toPhoto(hit2) : null;
        } catch {
          return null;
        }
      })()
    );
  }
  return cache.get(key)!;
}
