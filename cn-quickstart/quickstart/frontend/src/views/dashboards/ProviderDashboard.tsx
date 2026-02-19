import React, { useEffect } from 'react';
import { FileText, Users, Activity } from 'lucide-react';
import { useInvoiceStore } from '../../stores/invoiceStore';
import type { InvoiceResponse } from '../../openapi.d.ts';
import PageTransition from '../../components/ui/PageTransition';
import SummaryCard from '../../components/ui/SummaryCard';
import DataTable, { type Column } from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatCurrency } from '../../components/ui/roles';

const ProviderDashboard: React.FC = () => {
    const { invoices, fetchInvoices } = useInvoiceStore();

    useEffect(() => {
        fetchInvoices();
        const interval = setInterval(fetchInvoices, 5000);
        return () => clearInterval(interval);
    }, [fetchInvoices]);

    const totalInvoices = invoices.length;
    const activeParties = new Set([...invoices.map((inv: InvoiceResponse) => inv.seller), ...invoices.map((inv: InvoiceResponse) => inv.buyer)]).size;
    const pendingPayments = invoices.filter((inv: InvoiceResponse) => inv.status !== 'Paid').length;

    const columns: Column<InvoiceResponse>[] = [
        { key: 'invoiceNum', header: 'Invoice #', render: (inv) => <span className="text-sm font-medium text-zinc-900">INV-{inv.invoiceNum}</span> },
        { key: 'seller', header: 'Seller', render: (inv) => <span className="text-sm text-zinc-500">{inv.seller}</span> },
        { key: 'buyer', header: 'Buyer', render: (inv) => <span className="text-sm text-zinc-500">{inv.buyer}</span> },
        { key: 'grandTotal', header: 'Total', align: 'right', render: (inv) => <span className="text-sm font-medium text-zinc-900 tabular-nums">{formatCurrency(inv.grandTotal || 0)}</span> },
        { key: 'status', header: 'Status', render: (inv) => <StatusBadge status={inv.status} /> },
    ];

    return (
        <PageTransition>
            <div className="p-6 lg:p-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Provider Dashboard</h1>
                    <p className="text-sm text-zinc-500 mt-1">Platform overview and activity</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <SummaryCard title="Total Invoices" value={totalInvoices} icon={FileText} delay={0} />
                    <SummaryCard title="Active Parties" value={activeParties} icon={Users} delay={0.05} />
                    <SummaryCard title="Pending Payments" value={pendingPayments} icon={Activity} delay={0.1} />
                </div>

                <DataTable
                    columns={columns}
                    data={invoices}
                    keyExtractor={(inv) => inv.contractId}
                    title="All Invoices"
                    emptyTitle="No invoices found"
                    emptyDescription="Invoices will appear here once created by sellers."
                    emptyIcon={FileText}
                />
            </div>
        </PageTransition>
    );
};

export default ProviderDashboard;
