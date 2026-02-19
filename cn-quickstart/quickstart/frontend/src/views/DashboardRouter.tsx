import React from 'react';
import { useUserStore } from '../stores/userStore';
import SellerDashboard from './dashboards/SellerDashboard';
import BuyerDashboard from './dashboards/BuyerDashboard';
import CarrierDashboard from './dashboards/CarrierDashboard';
import BookkeeperDashboard from './dashboards/BookkeeperDashboard';
import ProviderDashboard from './dashboards/ProviderDashboard';
import { Link } from 'react-router-dom';
import { SkeletonCard } from '../components/ui/Skeleton';
import { LogIn } from 'lucide-react';

const DashboardRouter: React.FC = () => {
    const { user, loading, fetchUser } = useUserStore();

    React.useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    if (loading) {
        return (
            <div className="p-6 lg:p-8 space-y-6">
                <div className="h-8 w-48 bg-zinc-200 rounded-lg animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
                <div className="bg-white rounded-xl border border-zinc-200/60 p-6">
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-4 bg-zinc-200 rounded animate-pulse" style={{ width: `${80 - i * 10}%` }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="rounded-full bg-zinc-100 p-4">
                    <LogIn className="h-8 w-8 text-zinc-400" />
                </div>
                <p className="text-zinc-600 font-medium">Please log in to view your dashboard.</p>
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors duration-150 no-underline"
                >
                    <LogIn className="h-4 w-4" />
                    Login
                </Link>
            </div>
        );
    }

    switch (user.name) {
        case 'app-provider': return <ProviderDashboard />;
        case 'seller': return <SellerDashboard />;
        case 'buyer': return <BuyerDashboard />;
        case 'logistics': return <CarrierDashboard />;
        case 'finance': return <BookkeeperDashboard />;
        default: return <SellerDashboard />;
    }
};

export default DashboardRouter;
