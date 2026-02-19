import React from 'react';
import Sidebar from './Sidebar';
import { useUserStore } from '../../stores/userStore';

interface AppLayoutProps {
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const { user } = useUserStore();

    if (!user) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen bg-zinc-50">
            <Sidebar />
            <main className="flex-1 ml-[256px] transition-all duration-200">
                {children}
            </main>
        </div>
    );
};

export default AppLayout;
