import React from 'react';
import { TransparencyStatus } from '../../types';

interface AngkaProps {
  nilai: number | string;
  format?: 'angka' | 'persen' | 'rasio' | 'hari';
  status: TransparencyStatus;
  sumber?: string;
  rentang?: string;
  className?: string;
}

export const Angka: React.FC<AngkaProps> = ({
  nilai,
  format = 'angka',
  status,
  sumber,
  rentang,
  className = '',
}) => {
  let formatted = String(nilai);
  if (typeof nilai === 'number') {
    if (format === 'persen') {
      formatted = `${(nilai * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`;
    } else if (format === 'rasio') {
      formatted = nilai.toLocaleString('id-ID', { maximumFractionDigits: 4 });
    } else if (format === 'hari') {
      formatted = `${nilai.toLocaleString('id-ID', { maximumFractionDigits: 1 })} hari`;
    } else {
      formatted = nilai.toLocaleString('id-ID');
    }
  }

  // Label dot color
  const statusColorMap: Record<TransparencyStatus, string> = {
    BERSUMBER: 'bg-transparency-bersumber',
    KALIBRASI: 'bg-transparency-kalibrasi',
    ASUMSI: 'bg-transparency-asumsi',
    ILUSTRASI: 'bg-transparency-ilustrasi',
    FIKTIF: 'bg-transparency-fiktif',
  };

  return (
    <span className={`group relative inline-flex items-center gap-1.5 font-mono ${className}`}>
      <span className="tabular-nums font-bold">{formatted}</span>
      <span
        tabIndex={0}
        role="button"
        aria-label={`Status angka: ${status}${sumber ? `, sumber: ${sumber}` : ''}`}
        className={`inline-block h-2 w-2 rounded-full cursor-help ${statusColorMap[status]} transition-transform hover:scale-125 focus:ring-2 focus:ring-brand-blue`}
      />
      
      {/* Tooltip on hover/focus */}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 flex-col rounded-lg bg-ink p-2.5 text-xs text-white shadow-xl group-hover:flex group-focus-within:flex min-w-[200px] max-w-[280px]">
        <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1">
          <span className="font-semibold text-white/90">Status Data:</span>
          <span className="font-mono font-bold text-xs uppercase px-1.5 py-0.5 rounded bg-white/10">
            {status}
          </span>
        </div>
        {sumber && (
          <p className="text-[11px] text-white/80 leading-snug">
            <span className="font-semibold">Sumber:</span> {sumber}
          </p>
        )}
        {rentang && (
          <p className="text-[11px] text-white/70 mt-1">
            <span className="font-semibold">Rentang:</span> {rentang}
          </p>
        )}
      </div>
    </span>
  );
};

