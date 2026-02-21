import React from 'react';
import { motion } from 'framer-motion';
import { cn } from './cn';
import { SkeletonRow } from './Skeleton';
import EmptyState from './EmptyState';
import { type LucideIcon, Inbox } from 'lucide-react';

export interface Column<T> {
    key: string;
    header: string;
    align?: 'left' | 'right' | 'center';
    render: (row: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (row: T) => string;
    loading?: boolean;
    loadingRows?: number;
    emptyTitle?: string;
    emptyDescription?: string;
    emptyIcon?: LucideIcon;
    emptyAction?: React.ReactNode;
    title?: string;
    headerAction?: React.ReactNode;
    rowClassName?: (row: T) => string;
}

function DataTable<T>({
    columns,
    data,
    keyExtractor,
    loading = false,
    loadingRows = 5,
    emptyTitle = 'No data found',
    emptyDescription,
    emptyIcon = Inbox,
    emptyAction,
    title,
    headerAction,
    rowClassName,
}: DataTableProps<T>) {
    return (
        <div className="bg-white rounded-xl border border-zinc-200/60">
            {(title || headerAction) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                    {title && <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">{title}</h2>}
                    {headerAction}
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-zinc-100">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        'px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider',
                                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                                        col.className,
                                    )}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {loading ? (
                            Array.from({ length: loadingRows }).map((_, i) => (
                                <SkeletonRow key={i} cols={columns.length} />
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length}>
                                    <EmptyState
                                        icon={emptyIcon}
                                        title={emptyTitle}
                                        description={emptyDescription}
                                        action={emptyAction}
                                    />
                                </td>
                            </tr>
                        ) : (
                            data.map((row, idx) => (
                                <motion.tr
                                    key={keyExtractor(row)}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.15, delay: idx * 0.02 }}
                                    className={cn(
                                        'hover:bg-zinc-50/60 transition-colors duration-150',
                                        rowClassName?.(row),
                                    )}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={cn(
                                                'px-6 py-3.5 whitespace-nowrap text-sm',
                                                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                                            )}
                                        >
                                            {col.render(row)}
                                        </td>
                                    ))}
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default DataTable;
