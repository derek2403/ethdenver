import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    FilePlus,
    Users,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Zap,
    Wallet,
} from 'lucide-react';
import { cn } from './cn';
import { getRoleConfig, type RoleConfig } from './roles';
import { useUserStore } from '../../stores/userStore';

interface NavItem {
    label: string;
    to: string;
    icon: React.FC<{ className?: string }>;
}

const getNavItems = (role: RoleConfig, isAdmin: boolean): NavItem[] => {
    const items: NavItem[] = [
        { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    ];
    if (isAdmin || role.key === 'seller') {
        items.push({ label: 'New Invoice', to: '/invoices/new', icon: FilePlus });
    }
    if (isAdmin) {
        items.push({ label: 'Tenants', to: '/tenants', icon: Users });
    }
    return items;
};

const Sidebar: React.FC = () => {
    const [expanded, setExpanded] = useState(true);
    const { user, logout } = useUserStore();
    const location = useLocation();

    if (!user) return null;

    const role = getRoleConfig(user.name);
    const navItems = getNavItems(role, user.isAdmin);
    const RoleIcon = role.icon;

    return (
        <motion.aside
            animate={{ width: expanded ? 256 : 64 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="fixed left-0 top-0 h-screen bg-zinc-900 text-white flex flex-col z-40"
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 h-14 border-b border-white/10">
                <div className="rounded-lg p-1.5 bg-indigo-600 flex-shrink-0">
                    <Zap className="h-4 w-4 text-white" />
                </div>
                {expanded && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-semibold text-sm whitespace-nowrap tracking-tight"
                    >
                        Canton Invoice
                    </motion.span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-3 px-2 space-y-0.5">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.to;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={cn(
                                'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 no-underline',
                                isActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5',
                            )}
                        >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            {expanded && <span className="truncate">{item.label}</span>}
                        </Link>
                    );
                })}

                {/* Wallet button */}
                <button
                    onClick={() => {
                        const port = role.key === 'app-provider' ? 3000 : 2000;
                        window.open(
                            `http://wallet.localhost:${port}`,
                            'splice-wallet',
                            'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no',
                        );
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 text-zinc-400 hover:text-white hover:bg-white/5 w-full"
                >
                    <Wallet className="h-4 w-4 flex-shrink-0" />
                    {expanded && <span className="truncate">Wallet</span>}
                </button>
            </nav>

            {/* User section */}
            <div className="border-t border-white/10 p-3">
                <div className="flex items-center gap-2">
                    <div className={cn('h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0 bg-gradient-to-br', role.gradient)}>
                        <RoleIcon className="h-3.5 w-3.5 text-white" />
                    </div>
                    {expanded && (
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">{role.label}</p>
                            <p className="text-[11px] text-zinc-500 truncate">{user.name}</p>
                        </div>
                    )}
                    {expanded && (
                        <button
                            onClick={logout}
                            className="rounded-md p-1 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors duration-150"
                            title="Logout"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Collapse toggle */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors duration-150"
            >
                {expanded ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
        </motion.aside>
    );
};

export default Sidebar;
