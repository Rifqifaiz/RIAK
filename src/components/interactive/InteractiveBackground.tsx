import React, { useEffect, useRef } from 'react';

/**
 * Latar garis bergelombang yang bergerak pelan sendiri (tanpa reaksi kursor/klik).
 * Warna menyesuaikan tema; berhenti bergerak bila pengguna memilih "kurangi gerakan".
 */

interface Wave {
  /** posisi dasar vertikal (0–1 dari tinggi layar) */
  y: number;
  amp: number;
  freq: number;
  speed: number;
  phase: number;
  width: number;
}

const WAVES: Wave[] = [
  { y: 0.32, amp: 34, freq: 0.0015, speed: 0.12, phase: 0, width: 1.2 },
  { y: 0.58, amp: 44, freq: 0.0012, speed: 0.09, phase: 2.1, width: 1 },
  { y: 0.8, amp: 28, freq: 0.0018, speed: 0.14, phase: 4.2, width: 1 },
];

export const InteractiveBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let animId = 0;
    let last = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (t: number) => {
      const dark = document.documentElement.classList.contains('dark');
      ctx.clearRect(0, 0, width, height);
      const time = t / 1000;

      WAVES.forEach((w, i) => {
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        const a = dark ? 0.09 : 0.06;
        if (dark) {
          grad.addColorStop(0, `rgba(34, 211, 238, 0)`);
          grad.addColorStop(0.3, `rgba(96, 165, 250, ${a})`);
          grad.addColorStop(0.7, `rgba(236, 72, 153, ${a})`);
          grad.addColorStop(1, `rgba(236, 72, 153, 0)`);
        } else {
          grad.addColorStop(0, `rgba(30, 58, 138, 0)`);
          grad.addColorStop(0.3, `rgba(30, 58, 138, ${a})`);
          grad.addColorStop(0.7, `rgba(190, 24, 93, ${a})`);
          grad.addColorStop(1, `rgba(190, 24, 93, 0)`);
        }
        ctx.strokeStyle = grad;
        ctx.lineWidth = w.width;
        ctx.beginPath();
        const baseY = w.y * height;
        const ph = w.phase + time * w.speed;
        for (let x = -10; x <= width + 10; x += 8) {
          // dua gelombang ditumpuk agar terlihat organik, seperti riak air
          const y =
            baseY +
            Math.sin(x * w.freq + ph) * w.amp +
            Math.sin(x * w.freq * 2.3 - ph * 0.7 + i) * (w.amp * 0.35);
          if (x === -10) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
    };

    const loop = (t: number) => {
      animId = requestAnimationFrame(loop);
      if (t - last < 33) return; // ~30 fps cukup untuk gerakan pelan
      last = t;
      draw(t);
    };

    if (reduced) {
      draw(0);
      // gambar ulang saat tema berganti
      const mo = new MutationObserver(() => draw(0));
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      const onR = () => draw(0);
      window.addEventListener('resize', onR);
      return () => {
        mo.disconnect();
        window.removeEventListener('resize', resize);
        window.removeEventListener('resize', onR);
      };
    }

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0 h-full w-full" aria-hidden="true" />;
};
