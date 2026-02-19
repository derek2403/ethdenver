import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MoreVertical, type LucideIcon } from 'lucide-react';
import { cn } from './cn';

export interface ActionItem {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    variant?: 'default' | 'danger';
    disabled?: boolean;
}

interface ActionMenuProps {
    items: ActionItem[];
}

const ActionMenu: React.FC<ActionMenuProps> = ({ items }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative inline-block text-left">
            <button
                onClick={() => setOpen(!open)}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors duration-150"
            >
                <MoreVertical className="h-4 w-4" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 z-50 mt-1 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-zinc-200/60 py-1"
                    >
                        {items.map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setOpen(false);
                                        item.onClick();
                                    }}
                                    disabled={item.disabled}
                                    className={cn(
                                        'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors duration-150',
                                        item.variant === 'danger'
                                            ? 'text-red-600 hover:bg-red-50'
                                            : 'text-zinc-700 hover:bg-zinc-50',
                                        item.disabled && 'opacity-50 cursor-not-allowed',
                                    )}
                                >
                                    {Icon && <Icon className="h-4 w-4" />}
                                    {item.label}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ActionMenu;
