import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { geoOrthographic, geoPath, geoGraticule10, geoDistance, geoInterpolate, geoContains, geoCentroid } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import { Loader2 } from 'lucide-react';
import { loadWorld110, loadWorld50, INDONESIA_ID, INDONESIA_VIEW, scaleForZoom } from './worldData';

/**
 * Globe peta dunia berbasis kanvas 2D + proyeksi ortografis (d3-geo).
 * Tanpa WebGL → tampil di semua browser. Skala globe disamakan dengan zoom Leaflet,
 * sehingga saat "menyelam" globe menyambung mulus ke peta Indonesia.
 */

export interface GlobeHotspot {
  id: string;
  label: string;
  sub: string;
  desc: string;
  lat: number;
  lon: number;
  color: string;
  isTarget?: boolean;
}

export const GLOBE_HOTSPOTS: GlobeHotspot[] = [
  {
    id: 'india',
    label: 'India',
    sub: 'Varian Delta (B.1.617.2)',
    desc: 'Acuan historis: varian Delta pertama teridentifikasi di India akhir 2020, lalu memicu gelombang Jabodetabek Juni–Juli 2021.',
    lat: 20.59,
    lon: 78.96,
    color: '#ff4d7d',
  },
  {
    id: 'inggris',
    label: 'Inggris',
    sub: 'Varian Alpha (B.1.1.7)',
    desc: 'Acuan historis: varian Alpha teridentifikasi di Inggris pada akhir 2020 dan menyebar lewat jalur penerbangan internasional.',
    lat: 51.5,
    lon: -0.12,
    color: '#ffb020',
  },
  {
    id: 'afsel',
    label: 'Afrika Selatan',
    sub: 'Varian Beta (B.1.351)',
    desc: 'Acuan historis: varian Beta teridentifikasi di Afrika Selatan pada akhir 2020.',
    lat: -30.55,
    lon: 22.93,
    color: '#ff4d7d',
  },
  {
    id: 'jakarta',
    label: 'Jabodetabek',
    sub: 'Episentrum RI · wilayah pantau',
    desc: '13 kab/kota, 461 RS. Klik untuk masuk ke peta Indonesia.',
    lat: -6.2,
    lon: 106.8,
    color: '#22e5ff',
    isTarget: true,
  },
];

export interface InteractiveGlobeHandle {
  /** Putar ke Indonesia & perbesar sampai setara peta zoom 5, lalu panggil onDiveComplete. */
  dive: () => void;
  /** Kembali ke tampilan global. `from` = posisi peta saat ini agar sambungannya mulus. */
  reset: (from?: { lat: number; lon: number; zoom: number }) => void;
}

interface InteractiveGlobeProps {
  onDiveStart?: () => void;
  onDiveComplete?: () => void;
  onSelectHotspot?: (h: GlobeHotspot | null) => void;
  paused?: boolean;
  /** Tidak dipakai lagi (globe kanvas ringan), tetap diterima agar kompatibel. */
  deferBuild?: boolean;
  onUnavailable?: () => void;
  onContextLost?: () => void;
}

const D2R = Math.PI / 180;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;
const wrapLon = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;

interface View {
  lon: number;
  lat: number;
  k: number; // pengali skala terhadap radius dasar
}

export const InteractiveGlobe = forwardRef<InteractiveGlobeHandle, InteractiveGlobeProps>(
  ({ onDiveStart, onDiveComplete, onSelectHotspot, paused = false }, ref) => {
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [hint, setHint] = useState(false);
    const apiRef = useRef<InteractiveGlobeHandle>({ dive: () => {}, reset: () => {} });
    const retryRef = useRef<() => void>(() => {});
    const pausedRef = useRef(paused);
    const cbRef = useRef({ onDiveStart, onDiveComplete, onSelectHotspot });
    pausedRef.current = paused;
    cbRef.current = { onDiveStart, onDiveComplete, onSelectHotspot };

    useImperativeHandle(ref, () => ({
      dive: () => apiRef.current.dive(),
      reset: (from) => apiRef.current.reset(from),
    }));

    useEffect(() => {
      const wrap = wrapRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!wrap || !canvas || !ctx) return;
      let disposed = false;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // ---------- Ukuran ----------
      let W = 0;
      let H = 0;
      let dpr = 1;
      let baseR = 200;
      const resize = () => {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = wrap.clientWidth || 800;
        H = wrap.clientHeight || 600;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        baseR = Math.min(W, H) * 0.4;
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(wrap);

      // ---------- Proyeksi ----------
      const proj = geoOrthographic().clipAngle(90).precision(0.6);
      const path = geoPath(proj, ctx);
      const graticule = geoGraticule10();
      const view: View = { lon: 100, lat: 5, k: 1 };
      const kDive = () => scaleForZoom(INDONESIA_VIEW.zoom) / baseR;

      // ---------- Data ----------
      let world: { countries: any; borders: any; indo: any } | null = null;
      let detail: { features: Array<{ f: any; c: [number, number] }>; indo: any } | null = null;
      let dots: Float32Array | null = null; // [x,y,z,indo] per titik (vektor satuan)
      let fadeStart = 0;

      const load = () => {
        setStatus('loading');
        loadWorld110()
          .then((w) => {
            if (disposed) return;
            const countries = feature(w, w.objects.countries) as any;
            world = {
              countries,
              borders: mesh(w, w.objects.countries, (a: any, b: any) => a !== b),
              indo: countries.features.find((f: any) => String(f.id) === INDONESIA_ID),
            };
            fadeStart = performance.now();
            setStatus('ready');
            // Detail tinggi dimuat belakangan (untuk zoom dekat)
            window.setTimeout(() => {
              loadWorld50()
                .then((w50) => {
                  if (disposed) return;
                  const fc = feature(w50, w50.objects.countries) as any;
                  detail = {
                    features: fc.features.map((f: any) => ({ f, c: geoCentroid(f) as [number, number] })),
                    indo: fc.features.find((f: any) => String(f.id) === INDONESIA_ID),
                  };
                })
                .catch(() => {});
            }, 1200);
          })
          .catch((e) => {
            console.error('[RIAK globe] data peta dunia gagal dimuat', e);
            if (!disposed) setStatus('error');
          });

        // Titik daratan dari masker (opsional; globe tetap utuh tanpanya)
        const img = new Image();
        img.onload = () => {
          if (disposed) return;
          const mw = img.width;
          const mh = img.height;
          const c = document.createElement('canvas');
          c.width = mw;
          c.height = mh;
          const mctx = c.getContext('2d', { willReadFrequently: true })!;
          mctx.drawImage(img, 0, 0);
          const px = mctx.getImageData(0, 0, mw, mh).data;
          const N = 22000;
          const out: number[] = [];
          const golden = Math.PI * (3 - Math.sqrt(5));
          for (let i = 0; i < N; i++) {
            const y = 1 - (i / (N - 1)) * 2;
            const lat = Math.asin(y) / D2R;
            const lon = wrapLon((i * golden) / D2R);
            const x = Math.min(mw - 1, Math.floor(((lon + 180) / 360) * mw));
            const yy = Math.min(mh - 1, Math.floor(((90 - lat) / 180) * mh));
            const v = px[(yy * mw + x) * 4];
            if (v < 64) continue;
            const cl = Math.cos(lat * D2R);
            out.push(cl * Math.cos(lon * D2R), cl * Math.sin(lon * D2R), Math.sin(lat * D2R), v > 192 ? 1 : 0);
          }
          dots = new Float32Array(out);
        };
        img.src = './globe/mask.png';
      };
      retryRef.current = load;
      load();

      // ---------- Animasi (tween) ----------
      type Mode = 'idle' | 'focus' | 'diving' | 'dived' | 'returning';
      let mode: Mode = 'idle';
      let tween: null | {
        t0: number;
        dur: number;
        from: View;
        to: View;
        rotEase: (t: number) => number;
        zoomEase: (t: number) => number;
        done?: () => void;
      } = null;
      const startTween = (to: View, dur: number, rotEase: (t: number) => number, zoomEase: (t: number) => number, done?: () => void) => {
        const from = { ...view };
        const dLon = wrapLon(to.lon - from.lon); // putar lewat jalur terpendek
        tween = { t0: performance.now(), dur: reduced ? 1 : dur, from, to: { ...to, lon: from.lon + dLon }, rotEase, zoomEase, done };
      };

      const dive = () => {
        if (mode === 'diving' || mode === 'dived') return;
        mode = 'diving';
        cbRef.current.onDiveStart?.();
        // Putar dulu, lalu "terbang" mendekat (zoom dipercepat di akhir)
        startTween(
          { lon: INDONESIA_VIEW.lon, lat: INDONESIA_VIEW.lat, k: kDive() },
          1900,
          (t) => easeInOut(Math.min(1, t * 1.5)),
          (t) => easeIn(t),
          () => {
            mode = 'dived';
            cbRef.current.onDiveComplete?.();
          }
        );
      };

      apiRef.current = {
        dive,
        reset: (from) => {
          if (from) {
            view.lon = from.lon;
            view.lat = from.lat;
            view.k = scaleForZoom(from.zoom) / baseR;
          }
          mode = 'returning';
          startTween({ lon: view.lon, lat: Math.max(-30, Math.min(30, view.lat)) * 0.6, k: 1 }, 1500, easeOut, easeOut, () => {
            mode = 'idle';
          });
        },
      };

      // ---------- Interaksi ----------
      let dragging = false;
      let moved = 0;
      let last = { x: 0, y: 0 };
      let vel = { x: 0, y: 0 };
      let hovered: { kind: 'hotspot'; h: GlobeHotspot } | { kind: 'indo' } | null = null;
      let wheelArmed = false;

      const local = (e: { clientX: number; clientY: number }) => {
        const r = canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };
      const isVisible = (lon: number, lat: number) => geoDistance([lon, lat], [view.lon, view.lat]) < Math.PI / 2 - 0.03;

      const pick = (x: number, y: number) => {
        for (const h of GLOBE_HOTSPOTS) {
          if (!isVisible(h.lon, h.lat)) continue;
          const p = proj([h.lon, h.lat]);
          if (p && Math.hypot(p[0] - x, p[1] - y) < 14) return { kind: 'hotspot' as const, h };
        }
        if (Math.hypot(x - W / 2, y - H / 2) > baseR * view.k) return null;
        const ll = proj.invert?.([x, y]);
        if (ll && world?.indo && geoContains(world.indo, ll)) return { kind: 'indo' as const };
        return null;
      };

      const showTooltip = (x: number, y: number) => {
        const el = tooltipRef.current;
        if (!el) return;
        if (!hovered || dragging) {
          el.style.opacity = '0';
          return;
        }
        el.style.transform = `translate(${x + 14}px, ${y + 14}px)`;
        el.style.opacity = '1';
        el.innerHTML =
          hovered.kind === 'hotspot'
            ? `<div class="font-bold text-white">${hovered.h.label}</div><div class="text-[10px] text-cyan-200">${hovered.h.sub}</div><div class="mt-1 text-[10px] text-white/60">${
                hovered.h.isTarget ? 'Klik untuk masuk ke peta' : 'Klik untuk detail'
              }</div>`
            : `<div class="font-bold text-white">Indonesia</div><div class="mt-1 text-[10px] text-white/60">Klik untuk masuk ke peta Indonesia</div>`;
      };

      const onDown = (e: PointerEvent) => {
        if (mode === 'diving' || mode === 'dived') return;
        dragging = true;
        moved = 0;
        last = local(e);
        vel = { x: 0, y: 0 };
        canvas.setPointerCapture(e.pointerId);
      };
      const onMove = (e: PointerEvent) => {
        const p = local(e);
        if (dragging) {
          const dx = p.x - last.x;
          const dy = p.y - last.y;
          moved += Math.abs(dx) + Math.abs(dy);
          if (moved > 6 && (mode === 'focus' || mode === 'returning')) {
            mode = 'idle';
            tween = null;
          }
          if (moved > 6) {
            const s = 0.28 / view.k;
            view.lon = wrapLon(view.lon - dx * s);
            view.lat = Math.max(-75, Math.min(75, view.lat + dy * s));
            vel = { x: dx * s, y: dy * s };
          }
          last = p;
        } else if (mode !== 'diving' && mode !== 'dived') {
          hovered = pick(p.x, p.y);
          canvas.style.cursor = hovered ? 'pointer' : 'grab';
        }
        showTooltip(p.x, p.y);
      };
      const onUp = (e: PointerEvent) => {
        if (!dragging) return;
        dragging = false;
        if (moved >= 6) return;
        wheelArmed = true;
        setHint(false);
        const p = local(e);
        const hit = pick(p.x, p.y);
        if (hit?.kind === 'indo' || (hit?.kind === 'hotspot' && hit.h.isTarget)) {
          dive();
        } else if (hit?.kind === 'hotspot') {
          mode = 'focus';
          startTween({ lon: hit.h.lon, lat: hit.h.lat * 0.8, k: 1.25 }, 1100, easeInOut, easeInOut);
          cbRef.current.onSelectHotspot?.(hit.h);
        } else if (mode === 'focus') {
          mode = 'idle';
          startTween({ ...view, k: 1 }, 800, easeOut, easeOut);
          cbRef.current.onSelectHotspot?.(null);
        }
      };
      const onLeave = () => {
        hovered = null;
        wheelArmed = false;
        setHint(false);
        if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
      };
      const onEnter = () => {
        if (!wheelArmed) setHint(true);
      };
      // Zoom dengan scroll (setelah globe diklik) atau pinch trackpad (ctrlKey).
      // Melewati ambang → otomatis menyelam ke peta Indonesia.
      const onWheel = (e: WheelEvent) => {
        if (mode === 'diving' || mode === 'dived') {
          // sisa gulir saat menyelam jangan menggulir halaman
          e.preventDefault();
          return;
        }
        if (!wheelArmed && !e.ctrlKey) return;
        e.preventDefault();
        tween = null;
        if (mode !== 'idle') mode = 'idle';
        view.k = Math.max(0.85, Math.min(3.4, view.k * Math.exp(-e.deltaY * 0.0016)));
        if (view.k >= 3.2) dive();
      };

      canvas.addEventListener('pointerdown', onDown);
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerup', onUp);
      canvas.addEventListener('pointerleave', onLeave);
      canvas.addEventListener('pointerenter', onEnter);
      canvas.addEventListener('wheel', onWheel, { passive: false });

      let visible = true;
      const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
      io.observe(wrap);

      // ---------- Gambar ----------
      const jkt = GLOBE_HOTSPOTS.find((h) => h.isTarget)!;
      const routes = GLOBE_HOTSPOTS.filter((h) => !h.isTarget).map((h) => ({
        line: { type: 'LineString', coordinates: [[h.lon, h.lat], [jkt.lon, jkt.lat]] } as any,
        interp: geoInterpolate([h.lon, h.lat], [jkt.lon, jkt.lat]),
      }));

      const draw = (now: number) => {
        if (!(view.k > 0.05)) view.k = 0.05; // jaga agar radius tidak pernah negatif/0
        const r = Math.max(4, baseR * view.k);
        proj.scale(r).translate([W / 2, H / 2]).rotate([-view.lon, -view.lat]);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        const cx = W / 2;
        const cy = H / 2;
        const fade = fadeStart ? Math.min(1, (now - fadeStart) / 700) : 0;

        // Atmosfer
        if (r < Math.max(W, H) * 1.5) {
          const g = ctx.createRadialGradient(cx, cy, r * 0.96, cx, cy, r * 1.16);
          g.addColorStop(0, 'rgba(56, 189, 248, 0.42)');
          g.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(cx, cy, r * 1.16, 0, Math.PI * 2);
          ctx.fill();
        }

        // Laut
        const og = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.05, cx, cy, r);
        og.addColorStop(0, '#173a82');
        og.addColorStop(1, '#070f26');
        ctx.fillStyle = og;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Garis lintang-bujur
        ctx.beginPath();
        path(graticule);
        ctx.strokeStyle = 'rgba(125, 170, 255, 0.08)';
        ctx.lineWidth = 0.6;
        ctx.stroke();

        if (world && fade > 0) {
          ctx.globalAlpha = fade;
          const useDetail = !!detail && view.k > 2;
          ctx.beginPath();
          if (useDetail) {
            const center: [number, number] = [view.lon, view.lat];
            const reach = Math.min(1.6, 2.4 / view.k);
            for (const { f, c } of detail!.features) if (geoDistance(c, center) < reach) path(f);
          } else {
            path(world.countries);
          }
          ctx.fillStyle = '#1d3d86';
          ctx.fill();
          ctx.strokeStyle = 'rgba(150, 190, 255, 0.28)';
          ctx.lineWidth = 0.6;
          if (!useDetail) {
            ctx.beginPath();
            path(world.borders);
          }
          ctx.stroke();
          const indo = useDetail ? detail!.indo : world.indo;
          if (indo) {
            ctx.beginPath();
            path(indo);
            ctx.fillStyle = 'rgba(14, 116, 144, 0.9)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(34, 229, 255, 0.95)';
            ctx.lineWidth = 1.1;
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }

        // Titik daratan (memudar saat zoom)
        const dotA = fade * Math.max(0, 1 - (view.k - 1) / 1.4);
        if (dots && dotA > 0.02) {
          const lam = view.lon * D2R;
          const phi = view.lat * D2R;
          const vx = Math.cos(phi) * Math.cos(lam);
          const vy = Math.cos(phi) * Math.sin(lam);
          const vz = Math.sin(phi);
          const size = Math.max(1, r / 260);
          for (let pass = 0; pass < 2; pass++) {
            ctx.fillStyle = pass === 0 ? `rgba(147, 180, 255, ${0.5 * dotA})` : `rgba(34, 229, 255, ${0.95 * dotA})`;
            for (let i = 0; i < dots.length; i += 4) {
              if (dots[i + 3] !== pass) continue;
              if (dots[i] * vx + dots[i + 1] * vy + dots[i + 2] * vz < 0.04) continue;
              const p = proj([Math.atan2(dots[i + 1], dots[i]) / D2R, Math.asin(dots[i + 2]) / D2R]);
              if (p) ctx.fillRect(p[0] - size / 2, p[1] - size / 2, size, size);
            }
          }
        }

        // Bayangan tepi (kesan bola 3D)
        const sh = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.25, r * 0.55, cx, cy, r);
        sh.addColorStop(0, 'rgba(0,0,0,0)');
        sh.addColorStop(1, 'rgba(2, 6, 20, 0.5)');
        ctx.fillStyle = sh;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Jalur impor & pulsa
        const routeA = Math.max(0, 1 - (view.k - 1) / 2);
        if (routeA > 0.02) {
          ctx.lineWidth = 1.4;
          for (const rt of routes) {
            ctx.beginPath();
            path(rt.line);
            ctx.strokeStyle = `rgba(255, 92, 154, ${0.55 * routeA})`;
            ctx.stroke();
            ctx.fillStyle = `rgba(255, 209, 227, ${routeA})`;
            for (let j = 0; j < 3; j++) {
              const pt = rt.interp((now / 4200 + j / 3) % 1);
              if (!isVisible(pt[0], pt[1])) continue;
              const p = proj(pt);
              if (!p) continue;
              ctx.beginPath();
              ctx.arc(p[0], p[1], 2.4, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // Hotspot + riak
        for (const h of GLOBE_HOTSPOTS) {
          if (!isVisible(h.lon, h.lat)) continue;
          const p = proj([h.lon, h.lat]);
          if (!p) continue;
          const ph = (((now / 1700 + h.lat * 0.01) % 1) + 1) % 1;
          ctx.strokeStyle = h.color;
          ctx.globalAlpha = 0.8 * (1 - ph);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(p[0], p[1], Math.max(0.1, 4 + ph * 16), 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.fillStyle = h.color;
          ctx.beginPath();
          ctx.arc(p[0], p[1], h.isTarget ? 5 : 3.8, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      // ---------- Loop (berbasis waktu → mulus di 60/120 Hz) ----------
      let prev = performance.now();
      let raf = 0;
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        const dt = Math.min(0.05, (now - prev) / 1000);
        prev = now;
        if (!visible || (pausedRef.current && mode === 'dived')) return;
        const f60 = dt * 60;

        if (tween) {
          const t = Math.min(1, (now - tween.t0) / tween.dur);
          const re = tween.rotEase(t);
          const ze = tween.zoomEase(t);
          view.lon = wrapLon(tween.from.lon + (tween.to.lon - tween.from.lon) * re);
          view.lat = tween.from.lat + (tween.to.lat - tween.from.lat) * re;
          view.k = tween.from.k + (tween.to.k - tween.from.k) * ze;
          if (t >= 1) {
            const done = tween.done;
            tween = null;
            done?.();
          }
        } else if ((mode === 'idle' || mode === 'focus') && !dragging) {
          view.lon = wrapLon(view.lon - vel.x * f60);
          view.lat = Math.max(-75, Math.min(75, view.lat + vel.y * f60));
          const damp = Math.pow(0.92, f60);
          vel.x *= damp;
          vel.y *= damp;
          if (mode === 'idle' && !reduced && !hovered) view.lon = wrapLon(view.lon + 5 * dt);
        }
        draw(now);
      };
      raf = requestAnimationFrame(loop);

      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerup', onUp);
        canvas.removeEventListener('pointerleave', onLeave);
        canvas.removeEventListener('pointerenter', onEnter);
        canvas.removeEventListener('wheel', onWheel);
      };
    }, []);

    return (
      <div ref={wrapRef} className="relative h-full w-full">
        <canvas ref={canvasRef} className="block h-full w-full touch-pan-y" style={{ cursor: 'grab' }} />
        <div
          ref={tooltipRef}
          className="pointer-events-none absolute left-0 top-0 rounded-xl border border-white/15 bg-[#0A1022]/90 px-3 py-2 text-xs shadow-lg backdrop-blur-md transition-opacity duration-150"
          style={{ opacity: 0 }}
        />
        {hint && status === 'ready' && (
          <div className="pointer-events-none absolute left-1/2 top-[14%] -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-[11px] text-white/80 backdrop-blur">
            Klik globe, lalu scroll untuk zoom
          </div>
        )}
        {status === 'loading' && (
          <div className="pointer-events-none absolute left-1/2 top-[58%] flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-[11px] text-cyan-100/90 backdrop-blur">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Memuat peta dunia…
          </div>
        )}
        {status === 'error' && (
          <div className="absolute left-1/2 top-[55%] flex -translate-x-1/2 flex-col items-center gap-2 rounded-2xl bg-black/60 px-4 py-3 text-center text-xs text-white backdrop-blur">
            Peta dunia gagal dimuat.
            <button type="button" onClick={() => retryRef.current()} className="rounded-lg bg-cyan-500 px-3 py-1.5 font-bold text-white hover:bg-cyan-400">
              Coba lagi
            </button>
          </div>
        )}
      </div>
    );
  }
);
InteractiveGlobe.displayName = 'InteractiveGlobe';
