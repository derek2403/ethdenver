import React from 'react';
import './App.css';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ToastProvider } from './stores/toastStore';
import LoginView from './views/LoginView';
import { UserProvider } from './stores/userStore';
import ToastNotification from './components/ToastNotification';
import DashboardRouter from './views/DashboardRouter';
import CreateInvoiceView from './views/CreateInvoiceView';
import { InvoiceProvider } from './stores/invoiceStore';
import { DisclosureProvider } from './stores/disclosureStore';
import { TenantRegistrationProvider } from "./stores/tenantRegistrationStore.tsx";
import TenantRegistrationView from './views/TenantRegistrationView.tsx';
import LandingPage from './views/LandingPage';
import AppLayout from './components/ui/AppLayout';

const composeProviders = (...providers: React.ComponentType<{ children: React.ReactNode }>[]) => {
    return providers.reduce(
        (AccumulatedProviders, CurrentProvider) => {
            return ({ children }: { children: React.ReactNode }) => (
                <AccumulatedProviders>
                    <CurrentProvider>
                        {children}
                    </CurrentProvider>
                </AccumulatedProviders>
            );
        },
        ({ children }: { children: React.ReactNode }) => <>{children}</>
    );
};

const AppProviders = composeProviders(
    ToastProvider,
    UserProvider,
    TenantRegistrationProvider,
    InvoiceProvider,
    DisclosureProvider
);

const AppRoutes: React.FC = () => {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginView />} />
                <Route path="/dashboard" element={<AppLayout><DashboardRouter /></AppLayout>} />
                <Route path="/invoices/new" element={<AppLayout><CreateInvoiceView /></AppLayout>} />
                <Route path="/tenants" element={<AppLayout><TenantRegistrationView /></AppLayout>} />
            </Routes>
        </AnimatePresence>
    );
};

const App: React.FC = () => {
    return (
        <AppProviders>
            <AppRoutes />
            <ToastNotification />
        </AppProviders>
    );
};

export default App;
