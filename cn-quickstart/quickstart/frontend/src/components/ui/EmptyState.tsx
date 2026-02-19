import React from 'react';
import { type LucideIcon, Inbox } from 'lucide-react';
import { cn } from './cn';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon = Inbox,
    title,
    description,
    action,
    className,
}) => (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
        <div className="rounded-full bg-zinc-100 p-3.5 mb-4">
            <Icon className="h-6 w-6 text-zinc-400" />
        </div>
        <h3 className="text-sm font-medium text-zinc-900">{title}</h3>
        {description && (
            <p className="mt-1 text-sm text-zinc-500 text-center max-w-sm">{description}</p>
        )}
        {action && <div className="mt-4">{action}</div>}
    </div>
);

export default EmptyState;
