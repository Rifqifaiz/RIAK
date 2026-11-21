import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';

interface DataMissingProps {
  label?: string;
  showLink?: boolean;
}

export const DataMissing: React.FC<DataMissingProps> = ({
  label = 'Data belum tersedia',
  showLink = true,
}) => {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-muted/70 text-xs italic">
      <HelpCircle className="h-3.5 w-3.5" />
      <span>{label}</span>
      {showLink && (
        <Link
          to="/metodologi"
          className="underline hover:text-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue rounded"
        >
          (isi di Metodologi)
        </Link>
      )}
    </span>
  );
};

