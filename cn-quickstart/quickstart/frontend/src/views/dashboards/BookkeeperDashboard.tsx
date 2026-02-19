import React, { useEffect, useMemo } from 'react';
import { Calculator, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';
import { useDisclosureStore } from '../../stores/disclosureStore';
import type { BookkeeperViewResponse, TaxEntryResponse } from '../../openapi.d.ts';
import PageTransition from '../../components/ui/PageTransition';
import SummaryCard from '../../components/ui/SummaryCard';
import DataTable, { type Column } from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import PrivacyBanner from '../../components/ui/PrivacyBanner';
import { formatCurrency } from '../../components/ui/roles';

const BookkeeperDashboard: React.FC = () => {
    const { bookkeeperViews, fetchBookkeeperViews, acknowledgeBookkeeperView } = useDisclosureStore();

    useEffect(() => {
        fetchBookkeeperViews();
        const interval = setInterval(fetchBookkeeperViews, 5000);
        return () => clearInterval(interval);
    }, [fetchBookkeeperViews]);

    const totalInvoiced = useMemo(() => bookkeeperViews.reduce((sum: number, v: BookkeeperViewResponse) => sum + v.grandTotal, 0), [bookkeeperViews]);
    const taxDue = useMemo(() => bookkeeperViews.reduce((sum: number, v: BookkeeperViewResponse) => {
        const viewTax = (v.taxBreakdown || []).reduce((tSum: number, entry: TaxEntryResponse) => tSum + (entry.taxAmount || 0), 0);
        return sum + viewTax;
    }, 0), [bookkeeperViews]);
    const outstanding = useMemo(() => bookkeeperViews.filter((v: BookkeeperViewResponse) => v.status !== 'Paid').reduce((sum: number, v: BookkeeperViewResponse) => sum + (v.balanceDue || 0), 0), [bookkeeperViews]);
    const paid = useMemo(() => bookkeeperViews.filter((v: BookkeeperViewResponse) => v.status === 'Paid').reduce((sum: number, v: BookkeeperViewResponse) => sum + v.grandTotal, 0), [bookkeeperViews]);

    const columns: Column<BookkeeperViewResponse>[] = [
        { key: 'invoiceNum', header: 'Invoice #', render: (v) => <span className="text-sm font-medium text-zinc-900">INV-{v.invoiceNum}</span> },
        { key: 'date', header: 'Date', render: (v) => <span className="text-sm text-zinc-500">{v.invoiceDate ? new Date(v.invoiceDate).toLocaleDateString() : '--'}</span> },
        { key: 'seller', header: 'Seller', render: (v) => <span className="text-sm text-zinc-500">{v.sellerName}</span> },
        { key: 'buyer', header: 'Buyer', render: (v) => <span className="text-sm text-zinc-500">{v.buyerName}</span> },
        { key: 'subtotal', header: 'Subtotal', align: 'right', render: (v) => <span className="text-sm font-medium text-zinc-900 tabular-nums">{formatCurrency(v.subtotal || 0)}</span> },
        { key: 'tax', header: 'Tax', align: 'right', render: (v) => {
            const totalTax = (v.taxBreakdown || []).reduce((sum: number, entry: TaxEntryResponse) => sum + (entry.taxAmount || 0), 0);
            return <span className="text-sm font-medium text-zinc-900 tabular-nums">{formatCurrency(totalTax)}</span>;
        }},
        { key: 'grandTotal', header: 'Grand Total', align: 'right', render: (v) => <span className="text-sm font-medium text-zinc-900 tabular-nums">{formatCurrency(v.grandTotal)}</span> },
        { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v.status} /> },
        { key: 'actions', header: '', align: 'right', render: (v) => (
            <button onClick={() => acknowledgeBookkeeperView(v.contractId)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition-colors duration-150">
                <CheckCircle className="h-3.5 w-3.5" /> Acknowledge
            </button>
        )},
    ];

    return (
        <PageTransition>
            <div className="p-6 lg:p-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Bookkeeper Dashboard</h1>
                    <p className="text-sm text-zinc-500 mt-1">Financial summaries and tax overview</p>
                </div>

                <PrivacyBanner role="finance" />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard title="Total Invoiced" value={totalInvoiced} format={formatCurrency} icon={DollarSign} delay={0} />
                    <SummaryCard title="Tax Due" value={taxDue} format={formatCurrency} icon={Calculator} delay={0.05} />
                    <SummaryCard title="Outstanding" value={outstanding} format={formatCurrency} icon={AlertTriangle} delay={0.1} />
                    <SummaryCard title="Paid" value={paid} format={formatCurrency} icon={CheckCircle} delay={0.15} />
                </div>

                <DataTable
                    columns={columns}
                    data={bookkeeperViews}
                    keyExtractor={(v) => v.contractId}
                    title="Financial Records"
                    emptyTitle="No financial records available"
                    emptyDescription="Financial data will appear here when shared by a seller."
                    emptyIcon={Calculator}
                />
            </div>
        </PageTransition>
    );
};

export default BookkeeperDashboard;
