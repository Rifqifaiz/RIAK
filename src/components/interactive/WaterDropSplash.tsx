import React, { useEffect, useRef, useState } from 'react';

interface WaterDropSplashProps {
  onComplete: () => void;
  /** Sapaan setelah login, mis. "Selamat datang, Akun Demo". */
  greeting?: string;
  /** Bila diisi, lanjut otomatis sekian ms setelah logo tampil. */
  autoCloseMs?: number;
}

export const WaterDropSplash: React.FC<WaterDropSplashProps> = ({ onComplete, greeting, autoCloseMs }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stage, setStage] = useState<'falling' | 'impact' | 'revealed'>('falling');
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(onComplete);
  doneRef.current = onComplete;

  const close = () => {
    if (leaving) return;
    setLeaving(true);
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
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Drop properties
    let dropY = -20;
    let dropSpeed = 16;
    const dropX = width / 2;
    const impactY = height / 2;

    // Rings properties
    interface Ring {
      r: number;
      maxR: number;
      opacity: number;
      speed: number;
      color: string;
    }
    const rings: Ring[] = [];

    // Particles properties
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      opacity: number;
      color: string;
    }
    const particles: Particle[] = [];

    let hasImpacted = false;
    let animId: number;

    const render = () => {
      ctx.fillStyle = 'rgba(10, 14, 26, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // Phase 1: Droplet falling
      if (!hasImpacted) {
        dropY += dropSpeed;
        dropSpeed += 0.9; // acceleration

        // Draw falling droplet with tail
        const gradient = ctx.createLinearGradient(dropX, dropY - 30, dropX, dropY);
        gradient.addColorStop(0, 'rgba(0, 242, 254, 0)');
        gradient.addColorStop(1, 'rgba(0, 242, 254, 0.95)');

        ctx.beginPath();
        ctx.arc(dropX, dropY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#00F2FE';
        ctx.shadowColor = '#00F2FE';
        ctx.shadowBlur = 20;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(dropX - 4, dropY);
        ctx.lineTo(dropX, dropY - 35);
        ctx.lineTo(dropX + 4, dropY);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (dropY >= impactY) {
          hasImpacted = true;
          setStage('impact');

          // Spawn ripple rings
          for (let i = 0; i < 6; i++) {
            rings.push({
              r: 5,
              maxR: Math.max(width, height) * 0.75 + i * 80,
              opacity: 0.9,
              speed: 4.5 + i * 1.5,
              color: i % 2 === 0 ? '#00F2FE' : '#BE185D',
            });
          }

          // Spawn splash particles
          for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 3 + Math.random() * 8;
            particles.push({
              x: dropX,
              y: impactY,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd - (Math.random() * 6 + 2),
              r: Math.random() * 3.5 + 1.5,
              opacity: 1,
              color: Math.random() > 0.4 ? '#00F2FE' : '#BE185D',
            });
          }

          setTimeout(() => {
            setStage('revealed');
          }, 1400);
        }
      }

      // Phase 2: Ripple rings expanding
      if (hasImpacted) {
        rings.forEach((ring) => {
          ring.r += ring.speed;
          ring.opacity -= 0.007;

          if (ring.opacity > 0) {
            ctx.beginPath();
            ctx.arc(dropX, impactY, ring.r, 0, Math.PI * 2);
            ctx.strokeStyle = ring.color;
            ctx.lineWidth = Math.max(1, 4 * ring.opacity);
            ctx.shadowColor = ring.color;
            ctx.shadowBlur = 15;
            ctx.globalAlpha = Math.max(0, ring.opacity);
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
          }
        });

        // Splash particles
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.25; // gravity
          p.opacity -= 0.015;

          if (p.opacity > 0) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.opacity);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        });
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
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

