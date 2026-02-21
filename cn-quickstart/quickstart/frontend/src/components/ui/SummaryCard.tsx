import React from 'react';
import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

interface SummaryCardProps {
    title: string;
    value: number;
    format?: (n: number) => string;
    icon: LucideIcon;
    delay?: number;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
    title,
    value,
    format,
    icon: Icon,
    delay = 0,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay, ease: 'easeOut' }}
            className="bg-white rounded-xl border border-zinc-200/60 p-6 min-w-0 overflow-hidden"
        >
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-zinc-500">{title}</p>
                <Icon className="h-4 w-4 text-zinc-400" />
            </div>
            <p className="text-2xl font-bold text-zinc-900 tracking-tight tabular-nums truncate">
                <AnimatedCounter value={value} format={format} />
            </p>
        </motion.div>
    );
};

export default SummaryCard;
