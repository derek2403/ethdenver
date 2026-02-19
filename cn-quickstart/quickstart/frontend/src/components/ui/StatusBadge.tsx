import React from 'react';
import { cn } from './cn';

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    Issued: { bg: 'bg-blue-500/15', text: 'text-blue-600', label: 'Issued' },
    PartiallyPaid: { bg: 'bg-amber-500/15', text: 'text-amber-600', label: 'Partial' },
    Paid: { bg: 'bg-emerald-500/15', text: 'text-emerald-600', label: 'Paid' },
    Void: { bg: 'bg-red-500/15', text: 'text-red-600', label: 'Void' },
};

interface StatusBadgeProps {
    status: string;
    size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
    const config = statusConfig[status] || { bg: 'bg-zinc-500/15', text: 'text-zinc-500', label: status };

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full font-medium',
                config.bg,
                config.text,
                size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
            )}
        >
            {config.label}
        </span>
    );
};

export default StatusBadge;
