import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import { BwbStatus } from '../../types';

interface StatusBadgeProps {
  status: BwbStatus;
  customLabel?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, customLabel }) => {
  switch (status) {
    case 'AMAN':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-status-aman-bg px-2.5 py-1 text-xs font-semibold text-status-aman border border-status-aman/20">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>{customLabel || 'Aman (> 14 hari)'}</span>
        </span>
      );
    case 'SIAGA':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-status-siaga-bg px-2.5 py-1 text-xs font-semibold text-status-siaga border border-status-siaga/20">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>{customLabel || 'Siaga (0–14 hari)'}</span>
        </span>
      );
    case 'SIAGA_SEBAGIAN':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-status-siaga-bg px-2.5 py-1 text-xs font-semibold text-status-siaga border border-status-siaga/30">
          <Clock className="h-3.5 w-3.5" />
          <span>{customLabel || 'Siaga (Sebagian Lewat)'}</span>
        </span>
      );
    case 'TERLEWAT':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-status-terlewat-bg px-2.5 py-1 text-xs font-semibold text-status-terlewat border border-status-terlewat/20">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{customLabel || 'Terlewat (< 0 hari)'}</span>
        </span>
      );
  }
};

