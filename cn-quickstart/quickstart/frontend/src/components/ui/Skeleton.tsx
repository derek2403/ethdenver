import React from 'react';
import { cn } from './cn';

interface SkeletonProps {
    className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
    <div className={cn('animate-pulse rounded-md bg-zinc-100', className)} />
);

export const SkeletonRow: React.FC<{ cols: number }> = ({ cols }) => (
    <tr>
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} className="px-6 py-3.5">
                <Skeleton className="h-4 w-full" />
            </td>
        ))}
    </tr>
);

export const SkeletonCard: React.FC = () => (
    <div className="bg-white rounded-xl border border-zinc-200/60 p-6 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-20" />
    </div>
);

export default Skeleton;
