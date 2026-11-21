import React from 'react';
import { AlertCircle } from 'lucide-react';

export const Banner: React.FC = () => {
  return (
    <div className="w-full border-b border-line bg-surface-2 px-4 py-1.5 text-center text-xs text-ink-muted">
      <div className="mx-auto flex max-w-[1200px] items-center justify-center gap-2">
        <AlertCircle className="h-3.5 w-3.5 text-brand-blue shrink-0" />
        <span className="font-medium">
          Prototipe · data agregat · untuk pejabat dan manajemen faskes, bukan informasi publik.
        </span>
      </div>
    </div>
  );
};

