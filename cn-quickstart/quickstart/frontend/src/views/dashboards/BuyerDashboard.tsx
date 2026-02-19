import React, { useEffect, useMemo } from 'react';
import { Clock, DollarSign, CheckCircle, Wallet } from 'lucide-react';
import { useInvoiceStore } from '../../stores/invoiceStore';
import { useUserStore } from '../../stores/userStore';
import type { InvoiceResponse } from '../../openapi.d.ts';
import PageTransition from '../../components/ui/PageTransition';
import SummaryCard from '../../components/ui/SummaryCard';
import DataTable, { type Column } from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatCurrency } from '../../components/ui/roles';

const BuyerDashboard: React.FC = () => {
    const { invoices, fetchInvoices } = useInvoiceStore();
    const { user } = useUserStore();

    useEffect(() => {
        fetchInvoices();
        const interval = setInterval(fetchInvoices, 5000);
        return () => clearInterval(interval);
    }, [fetchInvoices]);

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const dueSoon = useMemo(() =>
        invoices.filter((inv: InvoiceResponse) => {
            if (inv.status === 'Paid') return false;
            const due = new Date(inv.dueDate);
            return due >= now && due <= sevenDaysFromNow;
        }).length, [invoices]);

    const totalOutstanding = useMemo(() =>
        invoices.filter((inv: InvoiceResponse) => inv.status !== 'Paid').reduce((sum: number, inv: InvoiceResponse) => sum + (inv.balanceDue || 0), 0), [invoices]);

    const paidThisMonth = useMemo(() =>
        invoices.filter((inv: InvoiceResponse) => {
            if (inv.status !== 'Paid') return false;
            const due = new Date(inv.dueDate);
            return due >= startOfMonth;
        }).reduce((sum: number, inv: InvoiceResponse) => sum + (inv.grandTotal || 0), 0), [invoices]);

    const sortedInvoices = useMemo(() =>
        [...invoices].sort((a: InvoiceResponse, b: InvoiceResponse) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()), [invoices]);

    const columns: Column<InvoiceResponse>[] = [
        { key: 'invoiceNum', header: 'Invoice #', render: (inv) => <span className="font-medium text-zinc-900">INV-{inv.invoiceNum}</span> },
        { key: 'seller', header: 'Seller', render: (inv) => <span className="text-zinc-500">{inv.seller}</span> },
        { key: 'grandTotal', header: 'Total', align: 'right', render: (inv) => <span className="font-medium text-zinc-900 tabular-nums">{formatCurrency(inv.grandTotal || 0)}</span> },
        { key: 'dueDate', header: 'Due Date', render: (inv) => {
            const isOverdue = inv.status !== 'Paid' && new Date(inv.dueDate) < now;
            return <span className={isOverdue ? 'text-red-600 font-medium' : 'text-zinc-500'}>{new Date(inv.dueDate).toLocaleDateString()}</span>;
        }},
        { key: 'status', header: 'Status', render: (inv) => <StatusBadge status={inv.status} /> },
        { key: 'balanceDue', header: 'Balance', align: 'right', render: (inv) => <span className="text-zinc-900 tabular-nums">{inv.status !== 'Paid' ? formatCurrency(inv.balanceDue || 0) : formatCurrency(0)}</span> },
        { key: 'actions', header: '', align: 'right', render: (inv) =>
            inv.status !== 'Paid' && user?.walletUrl ? (
                <a href={user.walletUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition-colors duration-150 no-underline">
                    <Wallet className="h-3.5 w-3.5" /> Wallet
                </a>
            ) : null
        },
    ];

    return (
        <PageTransition>
            <div className="p-6 lg:p-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Buyer Dashboard</h1>
                    <p className="text-sm text-zinc-500 mt-1">Track your invoices and payments</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <SummaryCard title="Due Soon (7d)" value={dueSoon} icon={Clock} delay={0} />
                    <SummaryCard title="Outstanding" value={totalOutstanding} format={formatCurrency} icon={DollarSign} delay={0.05} />
                    <SummaryCard title="Paid This Month" value={paidThisMonth} format={formatCurrency} icon={CheckCircle} delay={0.1} />
                </div>

                <DataTable
                    columns={columns}
                    data={sortedInvoices}
                    keyExtractor={(inv) => inv.contractId}
                    title="Invoices"
                    emptyTitle="No invoices found"
                    rowClassName={(inv) => inv.status !== 'Paid' && new Date(inv.dueDate) < now ? 'bg-red-50/50' : ''}
                />
            </div>
        </PageTransition>
    );
};

export default BuyerDashboard;
