import React, { useEffect, useRef, useState } from 'react';

interface WaterDropSplashProps {
  onComplete: () => void;
  /** Sapaan setelah login, mis. "Selamat datang, Akun Demo". */
  greeting?: string;
  /** Bila diisi, lanjut otomatis sekian ms setelah logo tampil. */
  autoCloseMs?: number;
  /** Dipanggil saat mulai memudar keluar (fade dikerjakan compositor, jadi aman untuk mulai memuat halaman). */
  onLeaving?: () => void;
}

export const WaterDropSplash: React.FC<WaterDropSplashProps> = ({ onComplete, greeting, autoCloseMs, onLeaving }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stage, setStage] = useState<'falling' | 'impact' | 'revealed'>('falling');
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(onComplete);
  doneRef.current = onComplete;
  const leavingRef = useRef(onLeaving);
  leavingRef.current = onLeaving;

  const close = () => {
    if (leaving) return;
    setLeaving(true);
    leavingRef.current?.();
    window.setTimeout(() => doneRef.current(), 650);
  };

  useEffect(() => {
    if (stage !== 'revealed' || !autoCloseMs) return;
    const t = window.setTimeout(close, autoCloseMs);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, autoCloseMs]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !ctx) return;

    // Kanvas tajam di layar retina, tapi dibatasi 2x agar tetap ringan
    let width = 0;
    let height = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Linimasa (ms). Semua gerak berbasis waktu → mulus di 60/120 Hz, tidak tergantung FPS.
    const T_FALL = reduced ? 0 : 750;
    const RING_GAP = 280;
    const RING_DUR = 2800;
    const RINGS = 5;
    const T_REVEAL = T_FALL + 700;
    const T_END = T_FALL + RING_GAP * (RINGS - 1) + RING_DUR;

    const easeIn = (t: number) => t * t * t;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    // Partikel percikan: dibuat sekali, posisi dihitung analitik dari waktu (tanpa akumulasi galat)
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const particles = Array.from({ length: 26 }, () => {
      const ang = rnd(Math.PI * 1.05, Math.PI * 1.95); // kebanyakan ke atas
      const spd = rnd(160, 420); // px/detik
      return {
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: rnd(1.4, 3.2),
        life: rnd(0.7, 1.2),
        pink: Math.random() < 0.35,
      };
    });

    let t0 = 0;
    let animId = 0;
    let impacted = false;
    let revealed = false;

    const ring = (cx: number, cy: number, r: number, a: number, rgb: string) => {
      if (a <= 0.01 || r <= 0) return;
      // "glow" murah: garis lebar transparan + garis tipis terang (pengganti shadowBlur yang berat)
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${rgb}, ${a * 0.18})`;
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.strokeStyle = `rgba(${rgb}, ${a})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    };

    let warm = 0;
    const frame = (now: number) => {
      // Dua frame pertama = pemanasan (alokasi kanvas, font). Linimasa baru mulai setelahnya
      // agar tetes tidak "meloncat" bila frame awal lambat.
      if (warm < 2) {
        warm += 1;
        t0 = now;
      }
      const t = now - t0;
      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.hypot(width, height) * 0.62;

      ctx.fillStyle = '#070A13';
      ctx.fillRect(0, 0, width, height);

      if (t < T_FALL) {
        // Tetes jatuh dengan percepatan
        const p = easeIn(t / T_FALL);
        const y = -30 + (cy + 30) * p;
        const tail = 14 + 40 * p;
        const g = ctx.createLinearGradient(cx, y - tail, cx, y);
        g.addColorStop(0, 'rgba(34, 229, 255, 0)');
        g.addColorStop(1, 'rgba(34, 229, 255, 0.9)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(cx - 3.5, y);
        ctx.quadraticCurveTo(cx, y - tail, cx + 3.5, y);
        ctx.fill();
        const glow = ctx.createRadialGradient(cx, y, 0, cx, y, 16);
        glow.addColorStop(0, 'rgba(34, 229, 255, 0.55)');
        glow.addColorStop(1, 'rgba(34, 229, 255, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(cx - 16, y - 16, 32, 32);
        ctx.fillStyle = '#C9F8FF';
        ctx.beginPath();
        ctx.arc(cx, y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        if (!impacted) {
          impacted = true;
          setStage('impact');
        }
        const ti = t - T_FALL;

        // Kilatan lembut di titik jatuh
        const flash = Math.max(0, 1 - ti / 900);
        if (flash > 0) {
          const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 140);
          fg.addColorStop(0, `rgba(34, 229, 255, ${0.35 * flash})`);
          fg.addColorStop(1, 'rgba(34, 229, 255, 0)');
          ctx.fillStyle = fg;
          ctx.fillRect(cx - 140, cy - 140, 280, 280);
        }

        // Cincin riak bergiliran
        for (let i = 0; i < RINGS; i++) {
          const local = ti - i * RING_GAP;
          if (local <= 0 || local >= RING_DUR) continue;
          const p = local / RING_DUR;
          const r = 6 + easeOut(p) * maxR;
          const a = Math.pow(1 - p, 1.6) * 0.85;
          ring(cx, cy, r, a, i % 2 === 0 ? '34, 229, 255' : '236, 72, 153');
        }

        // Percikan (gerak parabola)
        const s = ti / 1000;
        for (const pt of particles) {
          const life = 1 - s / pt.life;
          if (life <= 0) continue;
          const x = cx + pt.vx * s;
          const y = cy + pt.vy * s + 0.5 * 900 * s * s;
          ctx.fillStyle = pt.pink ? `rgba(236, 72, 153, ${life})` : `rgba(165, 243, 252, ${life})`;
          ctx.beginPath();
          ctx.arc(x, y, pt.r * (0.6 + 0.4 * life), 0, Math.PI * 2);
          ctx.fill();
        }

        if (!revealed && t >= T_REVEAL) {
          revealed = true;
          setStage('revealed');
        }
      }

      // Selesai: berhenti menggambar agar CPU/GPU bebas
      if (t < T_END) animId = requestAnimationFrame(frame);
    };
    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[2000] flex items-center justify-center bg-[#070A13] overflow-hidden select-none transition-opacity duration-700 ${
        leaving ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />

      {/* Center Reveal Content */}
      <div
        className={`relative z-10 flex flex-col items-center text-center transition-all duration-1000 ${
          stage === 'revealed'
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-90 translate-y-8'
        }`}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/40 px-4 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-md mb-4 shadow-[0_0_20px_rgba(0,242,254,0.2)]">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span>RADAR INDIKASI AWAL KEDARURATAN</span>
        </div>

        <h1 className="font-display text-7xl md:text-8xl font-extrabold tracking-tight text-white mb-2 drop-shadow-[0_0_35px_rgba(0,242,254,0.35)]">
          RIAK
        </h1>

        {greeting && <p className="mb-1 text-sm font-semibold text-white/80">{greeting}</p>}
        <p className="font-display text-lg md:text-xl font-light text-cyan-100/90 italic mb-8 max-w-md">
          "Lihat riaknya, cegah gelombangnya."
        </p>

        <button
          onClick={close}
          className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600 px-8 py-4 font-display text-sm font-bold text-white shadow-[0_0_30px_rgba(30,58,138,0.5)] hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <span>{autoCloseMs ? 'Masuk ke RIAK' : 'Buka Sistem Radar'}</span>
          <span className="text-cyan-300 transition-transform group-hover:translate-x-1.5">→</span>
        </button>

        <span className="mt-4 text-[11px] text-white/50">
          The 10th Open Innovation 2026 · IMERI FKUI
        </span>
      </div>
    </div>
  );
};

