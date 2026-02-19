import {
    Shield,
    FileText,
    ShoppingCart,
    Truck,
    Calculator,
    type LucideIcon,
} from 'lucide-react';

export interface RoleConfig {
    key: string;
    label: string;
    description: string;
    icon: LucideIcon;
    color: string;
    bgLight: string;
    bgDark: string;
    border: string;
    text: string;
    gradient: string;
}

export const ROLES: Record<string, RoleConfig> = {
    'app-provider': {
        key: 'app-provider',
        label: 'App Provider',
        description: 'System operator, manages platform',
        icon: Shield,
        color: 'slate',
        bgLight: 'bg-slate-50',
        bgDark: 'bg-slate-700',
        border: 'border-slate-500',
        text: 'text-slate-700',
        gradient: 'from-slate-600 to-slate-800',
    },
    seller: {
        key: 'seller',
        label: 'Seller',
        description: 'Creates invoices, manages payments',
        icon: FileText,
        color: 'indigo',
        bgLight: 'bg-indigo-50',
        bgDark: 'bg-indigo-600',
        border: 'border-indigo-500',
        text: 'text-indigo-700',
        gradient: 'from-indigo-500 to-indigo-700',
    },
    buyer: {
        key: 'buyer',
        label: 'Buyer',
        description: 'Receives and pays invoices',
        icon: ShoppingCart,
        color: 'emerald',
        bgLight: 'bg-emerald-50',
        bgDark: 'bg-emerald-600',
        border: 'border-emerald-500',
        text: 'text-emerald-700',
        gradient: 'from-emerald-500 to-emerald-700',
    },
    logistics: {
        key: 'logistics',
        label: 'Carrier',
        description: 'Handles logistics and delivery',
        icon: Truck,
        color: 'amber',
        bgLight: 'bg-amber-50',
        bgDark: 'bg-amber-600',
        border: 'border-amber-500',
        text: 'text-amber-700',
        gradient: 'from-amber-500 to-amber-700',
    },
    finance: {
        key: 'finance',
        label: 'Bookkeeper',
        description: 'Reviews financial summaries',
        icon: Calculator,
        color: 'sky',
        bgLight: 'bg-sky-50',
        bgDark: 'bg-sky-600',
        border: 'border-sky-500',
        text: 'text-sky-700',
        gradient: 'from-sky-500 to-sky-700',
    },
};

export const getRoleConfig = (username: string): RoleConfig => {
    return ROLES[username] || ROLES['app-provider'];
};

export const formatCurrency = (amount: number): string =>
    `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
