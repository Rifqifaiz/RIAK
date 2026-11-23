import React from 'react';

import logoTerang from '../../assets/riak-logo-light.png';
import logoGelap from '../../assets/riak-logo-dark.png';

/**
 * Logo resmi RIAK. Mode terang → versi gradien biru–pink; mode gelap → versi putih.
 * `onDark` memaksa versi putih untuk latar yang selalu gelap (splash, panel login).
 */
export const Logo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' | 'xl'; onDark?: boolean; tagline?: boolean }> = ({
  className = '',
  size = 'sm',
  onDark = false,
  tagline = true,
}) => {
  const h = { sm: 'h-8', md: 'h-9', lg: 'h-14', xl: 'h-24 md:h-28' }[size];
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {onDark ? (
        <img src={logoGelap} alt="RIAK" className={`${h} w-auto select-none`} draggable={false} />
      ) : (
        <>
          <img src={logoTerang} alt="RIAK" className={`${h} w-auto select-none dark:hidden`} draggable={false} />
          <img src={logoGelap} alt="RIAK" className={`${h} hidden w-auto select-none dark:block`} draggable={false} />
        </>
      )}
      {tagline && (
        <span className={`hidden max-w-[9rem] border-l pl-3 text-[10px] font-medium leading-tight tracking-tight sm:block ${
          onDark ? 'border-white/20 text-white/60' : 'border-line text-ink-muted'
        }`}>
          Radar Indikasi Awal Kedaruratan
        </span>
      )}
    </div>
  );
};

export const SectionTag: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <span
      className={`inline-block rounded-full bg-brand-gradient px-3 py-1 text-[11px] font-bold tracking-wider text-white uppercase shadow-sm ${className}`}
    >
      {children}
    </span>
  );
};

export const GlassPill: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/10 px-3.5 py-1 text-xs font-medium text-white backdrop-blur-md shadow-sm ${className}`}
    >
      {children}
    </div>
  );
};

export const GlassBar: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`w-full rounded-2xl border border-white/20 bg-white/10 p-3 text-sm text-white/90 backdrop-blur-md shadow-glass flex items-center justify-between ${className}`}
    >
      {children}
    </div>
  );
};

export const GradientCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}> = ({ children, className = '', hoverEffect = true }) => {
  return (
    <div
      className={`relative rounded-card border border-line bg-surface p-6 shadow-card transition-all duration-200 ${
        hoverEffect ? 'hover:shadow-elevated hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const StatTile: React.FC<{
  title: string;
  value: React.ReactNode;
  subtext?: string;
  statusBadge?: React.ReactNode;
  accentColor?: string;
}> = ({ title, value, subtext, statusBadge, accentColor }) => {
  return (
    <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-card overflow-hidden">
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 ${
          accentColor || 'bg-brand-gradient'
        }`}
      />
      <div className="flex items-center justify-between text-xs font-medium text-ink-muted mb-2">
        <span>{title}</span>
        {statusBadge}
      </div>
      <div className="font-mono text-3xl font-extrabold text-ink tabular-nums">
        {value}
      </div>
      {subtext && <p className="mt-1 text-xs text-ink-muted/80">{subtext}</p>}
    </div>
  );
};

export const TimelineBwb: React.FC<{
  tanggalHariIni: string;
  tanggalBwb: string;
  tanggalPenuh: string;
}> = ({ tanggalHariIni, tanggalBwb, tanggalPenuh }) => {
  return (
    <div className="w-full bg-surface-2 rounded-xl p-4 border border-line">
      <div className="flex items-center justify-between text-xs font-mono font-medium text-ink-muted mb-2">
        <span>Hari Ini ({tanggalHariIni})</span>
        <span className="text-brand-pink font-bold">BWB ({tanggalBwb})</span>
        <span className="text-status-terlewat font-bold">Faskes Penuh ({tanggalPenuh})</span>
      </div>
      <div className="relative flex h-3 w-full items-center rounded-full bg-line overflow-hidden">
        <div className="h-full bg-status-aman-bg border-r-2 border-status-aman w-1/3" />
        <div className="h-full bg-status-siaga-bg border-r-2 border-status-siaga w-1/3" />
        <div className="h-full bg-status-terlewat-bg w-1/3" />
      </div>
      <div className="flex items-center justify-between text-[11px] text-ink-muted mt-2">
        <span>Fase Waspada</span>
        <span className="text-center font-medium">Batas Waktu Bertindak</span>
        <span className="text-right">Kapasitas Kritis</span>
      </div>
    </div>
  );
};

