import React from 'react';

/**
 * Ilustrasi vektor ringan (tanpa file gambar eksternal). Bentuk & angka di sini
 * dekoratif, bukan data — jangan dibaca sebagai hasil model.
 */

const Frame: React.FC<{ id: string; children: React.ReactNode; className?: string; from?: string; to?: string }> = ({
  id,
  children,
  className = '',
  from = '#0B1430',
  to = '#2A1240',
}) => (
  <svg viewBox="0 0 320 180" className={`h-full w-full ${className}`} role="img" aria-hidden="true">
    <defs>
      <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={from} />
        <stop offset="1" stopColor={to} />
      </linearGradient>
      <radialGradient id={`glow-${id}`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#22e5ff" stopOpacity="0.45" />
        <stop offset="1" stopColor="#22e5ff" stopOpacity="0" />
      </radialGradient>
      <pattern id={`grid-${id}`} width="16" height="16" patternUnits="userSpaceOnUse">
        <path d="M16 0H0V16" fill="none" stroke="#fff" strokeOpacity="0.05" />
      </pattern>
    </defs>
    <rect width="320" height="180" fill={`url(#bg-${id})`} />
    <rect width="320" height="180" fill={`url(#grid-${id})`} />
    {children}
  </svg>
);

export const IlluRadar: React.FC<{ className?: string }> = ({ className }) => (
  <Frame id="radar" className={className}>
    <g transform="translate(160 92)">
      {[24, 46, 68].map((r) => (
        <circle key={r} r={r} fill="none" stroke="#22e5ff" strokeOpacity="0.25" />
      ))}
      <path d="M-70 0H70M0-70V70" stroke="#22e5ff" strokeOpacity="0.15" />
      <g className="anim-spin-slow">
        <path d="M0 0 L68 0 A68 68 0 0 0 48 -48 Z" fill="url(#glow-radar)" />
        <line x1="0" y1="0" x2="68" y2="0" stroke="#22e5ff" strokeWidth="2" />
      </g>
      <circle cx="-30" cy="-38" r="4" fill="#ff4d7d" />
      <circle cx="-30" cy="-38" r="4" fill="none" stroke="#ff4d7d" className="anim-ripple-ring" />
      <circle cx="40" cy="22" r="3" fill="#ffb020" />
      <circle cx="12" cy="44" r="3" fill="#ff4d7d" opacity="0.7" />
      <circle r="4" fill="#22e5ff" />
    </g>
    <g className="anim-float">
      <path d="M262 36 l14 -6 l-4 14 l-3 -5 z" fill="#fff" opacity="0.8" />
      <path d="M50 132 q40 -60 110 -40" stroke="#ff5c9a" strokeDasharray="4 4" fill="none" opacity="0.6" />
    </g>
  </Frame>
);

export const IlluPeta: React.FC<{ className?: string }> = ({ className }) => (
  <Frame id="peta" className={className} from="#0A1838" to="#0E2A44">
    {/* Pulau stilisasi */}
    <path d="M40 120 q30 -28 70 -18 t70 -4 q30 2 60 18 q-20 16 -70 14 t-80 4 q-30 -2 -50 -14z" fill="#1d3f7a" opacity="0.9" />
    <path d="M200 70 q20 -10 44 -2 q10 10 -6 18 q-24 6 -38 -16z" fill="#1d3f7a" opacity="0.7" />
    <g transform="translate(150 108)">
      {[0, 1, 2].map((i) => (
        <circle key={i} r="10" fill="none" stroke="#22e5ff" strokeWidth="1.5" className="anim-ripple-ring" style={{ animationDelay: `${i}s` }} />
      ))}
      <circle r="5" fill="#22e5ff" />
    </g>
    {[
      [104, 112, 6, '#7dd3fc'],
      [190, 116, 8, '#BE185D'],
      [124, 128, 5, '#7dd3fc'],
      [176, 98, 4, '#7dd3fc'],
      [214, 124, 6, '#BE185D'],
    ].map(([x, y, r, c], i) => (
      <circle key={i} cx={x as number} cy={y as number} r={r as number} fill={c as string} opacity="0.75" className="riak-grow" style={{ animationDelay: `${0.2 + i * 0.15}s` }} />
    ))}
    <path d="M150 108 L104 112 M150 108 L190 116 M150 108 L176 98 M150 108 L214 124" stroke="#22e5ff" strokeOpacity="0.35" strokeDasharray="3 3" />
    <rect x="22" y="22" width="92" height="34" rx="8" fill="#000" fillOpacity="0.35" stroke="#fff" strokeOpacity="0.1" />
    <rect x="32" y="34" width="72" height="4" rx="2" fill="#fff" fillOpacity="0.15" />
    <rect x="32" y="34" width="44" height="4" rx="2" fill="#22e5ff" />
    <circle cx="76" cy="36" r="5" fill="#fff" />
  </Frame>
);

export const IlluRespons: React.FC<{ className?: string }> = ({ className }) => (
  <Frame id="respons" className={className} from="#1A1033" to="#3A1030">
    {/* Gedung RS */}
    <g transform="translate(46 54)">
      <rect width="86" height="96" rx="6" fill="#26346b" />
      <rect x="30" y="-16" width="26" height="20" rx="3" fill="#26346b" />
      <path d="M43 -12v12M37 -6h12" stroke="#fff" strokeWidth="3" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <rect key={`${r}${c}`} x={12 + c * 24} y={14 + r * 22} width="14" height="12" rx="2" fill={r === 0 && c === 2 ? '#ffb020' : '#7dd3fc'} opacity={0.75} />
        ))
      )}
      <rect x="32" y="76" width="22" height="20" fill="#0B1430" />
    </g>
    {/* Hitung mundur */}
    <g transform="translate(220 92)">
      <circle r="50" fill="none" stroke="#fff" strokeOpacity="0.1" strokeWidth="10" />
      <circle r="50" fill="none" stroke="url(#bg-respons)" strokeWidth="0" />
      <circle r="50" fill="none" stroke="#ffb020" strokeWidth="10" strokeDasharray="314" strokeDashoffset="110" strokeLinecap="round" transform="rotate(-90)" />
      <text textAnchor="middle" y="4" fontFamily="JetBrains Mono" fontWeight="800" fontSize="26" fill="#fff">BWB</text>
      <text textAnchor="middle" y="22" fontFamily="Inter" fontSize="9" fill="#fff" opacity="0.6">hitung mundur</text>
    </g>
  </Frame>
);

export const IlluLatihan: React.FC<{ className?: string }> = ({ className }) => (
  <Frame id="latihan" className={className} from="#0B1A2E" to="#14324A">
    <rect x="60" y="62" width="200" height="90" rx="12" fill="#1d3f7a" />
    <rect x="70" y="72" width="180" height="70" rx="8" fill="#0B1430" />
    <path d="M84 126 l26 -20 l20 10 l26 -26 l22 14 l28 -24" stroke="#22e5ff" strokeWidth="2.5" fill="none" />
    {[
      [74, 54],
      [160, 40],
      [246, 54],
    ].map(([x, y], i) => (
      <g key={i} transform={`translate(${x} ${y})`} className="anim-float" style={{ animationDelay: `${i * 0.6}s` }}>
        <circle r="12" fill="#BE185D" />
        <circle cy="-4" r="4" fill="#fff" opacity="0.85" />
        <path d="M-6 6 q6 -6 12 0" stroke="#fff" strokeWidth="2" fill="none" opacity="0.85" />
      </g>
    ))}
  </Frame>
);

export const IlluSimulator: React.FC<{ className?: string }> = ({ className }) => (
  <Frame id="sim" className={className} from="#1A1033" to="#0B1F3A">
    <path d="M30 150 C90 150 110 40 160 40 S230 150 290 150" stroke="#BE185D" strokeWidth="3" fill="none" opacity="0.8" />
    <path d="M30 150 C110 150 140 80 190 80 S260 150 290 150" stroke="#22e5ff" strokeWidth="3" fill="none" />
    <line x1="30" y1="96" x2="290" y2="96" stroke="#ff6b6b" strokeDasharray="6 4" opacity="0.8" />
    {[0, 1, 2].map((i) => (
      <g key={i} transform={`translate(40 ${24 + i * 18})`}>
        <rect width="80" height="4" rx="2" fill="#fff" opacity="0.15" />
        <circle cx={[56, 30, 66][i]} cy="2" r="6" fill="#fff" />
      </g>
    ))}
  </Frame>
);

export const IlluStudiKasus: React.FC<{ className?: string }> = ({ className }) => (
  <Frame id="studi" className={className} from="#0B1430" to="#1E1B4B">
    {Array.from({ length: 16 }).map((_, i) => {
      const h = 14 + Math.round(90 * Math.exp(-Math.pow((i - 10) / 3.4, 2)));
      return <rect key={i} x={30 + i * 16} y={150 - h} width="10" height={h} rx="2" fill={i > 8 && i < 12 ? '#BE185D' : '#3b5bb5'} opacity="0.85" />;
    })}
    <line x1="194" y1="30" x2="194" y2="156" stroke="#ffb020" strokeDasharray="4 3" />
    <rect x="200" y="30" width="78" height="20" rx="6" fill="#ffb020" fillOpacity="0.15" stroke="#ffb020" strokeOpacity="0.4" />
    <text x="239" y="44" textAnchor="middle" fontFamily="Inter" fontSize="9" fontWeight="700" fill="#ffd27a">Jun 2021</text>
  </Frame>
);

export const IlluMetodologi: React.FC<{ className?: string }> = ({ className }) => (
  <Frame id="metode" className={className} from="#101A33" to="#22163A">
    <text x="160" y="84" textAnchor="middle" fontFamily="JetBrains Mono" fontWeight="800" fontSize="20" fill="#fff">BWB = T − L</text>
    <text x="160" y="106" textAnchor="middle" fontFamily="Inter" fontSize="10" fill="#fff" opacity="0.55">tanggal penuh − waktu tunggu</text>
    {['BERSUMBER', 'KALIBRASI', 'ASUMSI'].map((t, i) => (
      <g key={t} transform={`translate(${38 + i * 84} 132)`}>
        <rect width="78" height="20" rx="10" fill="#fff" fillOpacity="0.08" stroke="#fff" strokeOpacity="0.15" />
        <circle cx="12" cy="10" r="4" fill={['#93a8ff', '#2dd4bf', '#fbbf24'][i]} />
        <text x="21" y="14" fontFamily="Inter" fontSize="8" fontWeight="700" fill="#fff" opacity="0.8">{t}</text>
      </g>
    ))}
  </Frame>
);
