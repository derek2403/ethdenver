import React from 'react';
import { Link } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';

const roleBadge: Record<string, { label: string; color: string }> = {
    'app-provider': { label: 'App Provider', color: 'bg-slate-600' },
    'seller': { label: 'Seller', color: 'bg-indigo-600' },
    'buyer': { label: 'Buyer', color: 'bg-emerald-600' },
    'logistics': { label: 'Carrier', color: 'bg-amber-600' },
    'finance': { label: 'Bookkeeper', color: 'bg-sky-600' },
};

const Header: React.FC = () => {
    return (
        <header className="bg-white border-b border-gray-200 shadow-sm">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <Link to="/" className="text-xl font-bold text-gray-900 no-underline">
                    Canton Invoice
                </Link>
                <div className="flex items-center gap-4">
                    <AuthenticatedLinks />
                    <UserSection />
                </div>
            </nav>
        </header>
    );
};

const AuthenticatedLinks: React.FC = () => {
    const { user, loading, fetchUser } = useUserStore();

    React.useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    if (loading || user === null) return null;

    const name = user.name;

    return (
        <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 no-underline">
                Dashboard
            </Link>
            {(user.isAdmin || name === 'seller') && (
                <Link to="/invoices/new" className="text-sm text-gray-600 hover:text-gray-900 no-underline">
                    New Invoice
                </Link>
            )}
            {user.isAdmin && (
                <Link to="/tenants" className="text-sm text-gray-600 hover:text-gray-900 no-underline">
                    Tenants
                </Link>
            )}
        </div>
    );
};

const UserSection: React.FC = () => {
    const { user, loading, fetchUser, logout } = useUserStore();

    React.useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    if (loading) return <div className="text-sm text-gray-400">Loading...</div>;

    if (user === null) {
        return (
            <Link to="/login" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 no-underline">
                Login
            </Link>
        );
    }

    const badge = roleBadge[user.name] || { label: user.name, color: 'bg-gray-500' };

    return (
        <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${badge.color}`}>
                {badge.label}
            </span>
            <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
            >
                Logout
            </button>
        </div>
    );
};

export default Header;
