import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from './cn';

const privacyMessages: Record<string, string> = {
    logistics: 'Your Canton node contains ONLY logistics data. No prices, totals, or payment information exist here.',
    finance: 'Financial summaries only. No addresses, contacts, or line item details are available on your node.',
};

interface PrivacyBannerProps {
    role: string;
    className?: string;
}

const PrivacyBanner: React.FC<PrivacyBannerProps> = ({ role, className }) => {
    const message = privacyMessages[role];
    if (!message) return null;

    return (
        <div
            className={cn(
                'flex items-center gap-3 rounded-xl border border-indigo-200/60 bg-indigo-50/50 p-4',
                className,
            )}
        >
            <ShieldCheck className="h-4 w-4 flex-shrink-0 text-indigo-500" />
            <p className="text-sm text-indigo-700">{message}</p>
        </div>
    );
};

export default PrivacyBanner;
