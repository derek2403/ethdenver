import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, DollarSign, AlertTriangle, CheckCircle, Send, Share2, CreditCard, XCircle, FilePlus } from 'lucide-react';
import { useInvoiceStore } from '../../stores/invoiceStore';
import { useUserStore } from '../../stores/userStore';
import type { InvoiceResponse } from '../../openapi.d.ts';
import PageTransition from '../../components/ui/PageTransition';
import SummaryCard from '../../components/ui/SummaryCard';
import DataTable, { type Column } from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import ActionMenu, { type ActionItem } from '../../components/ui/ActionMenu';
import { formatCurrency } from '../../components/ui/roles';

const SellerDashboard: React.FC = () => {
    const { invoices, fetchInvoices, requestPayment, markPaid, cancelInvoice, shareWithCarrier, shareWithBookkeeper } = useInvoiceStore();
    const { user } = useUserStore();

    useEffect(() => {
        fetchInvoices();
        const interval = setInterval(fetchInvoices, 5000);
        return () => clearInterval(interval);
    }, [fetchInvoices]);

    const totalInvoices = invoices.length;
    const issuedCount = invoices.filter((inv: InvoiceResponse) => inv.status === 'Issued').length;
    const paidCount = invoices.filter((inv: InvoiceResponse) => inv.status === 'Paid').length;
    const totalRevenue = invoices.filter((inv: InvoiceResponse) => inv.status === 'Paid').reduce((sum: number, inv: InvoiceResponse) => sum + (inv.grandTotal || 0), 0);
    const outstandingBalance = invoices.filter((inv: InvoiceResponse) => inv.status !== 'Paid').reduce((sum: number, inv: InvoiceResponse) => sum + (inv.balanceDue || 0), 0);

    // Derive carrier/bookkeeper party IDs from seller's party (same participant fingerprint)
    const sellerFingerprint = user?.party?.split('::')[1] || '';
    const CARRIER_PARTY = sellerFingerprint ? `logistics::${sellerFingerprint}` : '';
    const BOOKKEEPER_PARTY = sellerFingerprint ? `finance::${sellerFingerprint}` : '';

    const handleShareWithCarrier = async (contractId: string) => {
        const carrierParty = window.prompt('Enter Carrier party ID:', CARRIER_PARTY);
        if (carrierParty) await shareWithCarrier(contractId, carrierParty);
    };

    const handleShareWithBookkeeper = async (contractId: string) => {
        const bookkeeperParty = window.prompt('Enter Bookkeeper party ID:', BOOKKEEPER_PARTY);
        if (bookkeeperParty) await shareWithBookkeeper(contractId, bookkeeperParty);
    };

    const handleRequestPayment = async (contractId: string) => {
        await requestPayment(contractId, { prepareUntilDuration: 'PT1H', settleBeforeDuration: 'PT2H' });
    };

    const handleMarkPaid = async (contractId: string) => {
        await markPaid(contractId);
    };

    const handleCancel = async (contractId: string) => {
        const reason = window.prompt('Reason for cancellation:');
        if (reason !== null) await cancelInvoice(contractId, reason || 'Cancelled by seller');
    };

    const getActions = (invoice: InvoiceResponse): ActionItem[] => {
        if (invoice.status === 'Paid') return [];
        return [
            { label: 'Mark as Paid', icon: CheckCircle, onClick: () => handleMarkPaid(invoice.contractId) },
            { label: 'Share w/ Carrier', icon: Share2, onClick: () => handleShareWithCarrier(invoice.contractId) },
            { label: 'Share w/ Bookkeeper', icon: Send, onClick: () => handleShareWithBookkeeper(invoice.contractId) },
            { label: 'Request Payment', icon: CreditCard, onClick: () => handleRequestPayment(invoice.contractId) },
            { label: 'Cancel', icon: XCircle, onClick: () => handleCancel(invoice.contractId), variant: 'danger' as const },
        ];
    };

    const columns: Column<InvoiceResponse>[] = [
        { key: 'invoiceNum', header: 'Invoice #', render: (inv) => <span className="font-medium text-zinc-900">INV-{inv.invoiceNum}</span> },
        { key: 'buyer', header: 'Buyer', render: (inv) => <span className="text-zinc-500">{inv.buyer}</span> },
        { key: 'grandTotal', header: 'Total', align: 'right', render: (inv) => <span className="font-medium text-zinc-900 tabular-nums">{formatCurrency(inv.grandTotal || 0)}</span> },
        { key: 'dueDate', header: 'Due Date', render: (inv) => <span className="text-zinc-500">{new Date(inv.dueDate).toLocaleDateString()}</span> },
        { key: 'status', header: 'Status', render: (inv) => <StatusBadge status={inv.status} /> },
        { key: 'actions', header: '', align: 'right', render: (inv) => { const actions = getActions(inv); return actions.length > 0 ? <ActionMenu items={actions} /> : null; } },
    ];

    return (
        <PageTransition>
            <div className="p-6 lg:p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Seller Dashboard</h1>
                        <p className="text-sm text-zinc-500 mt-1">Manage your invoices and payments</p>
                    </div>
                    <Link
                        to="/invoices/new"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors duration-150 no-underline"
                    >
                        <FilePlus className="h-4 w-4" />
                        New Invoice
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <SummaryCard title="Total Invoices" value={totalInvoices} icon={FileText} delay={0} />
                    <SummaryCard title="Issued" value={issuedCount} icon={AlertTriangle} delay={0.05} />
                    <SummaryCard title="Paid" value={paidCount} icon={CheckCircle} delay={0.1} />
                    <SummaryCard title="Revenue" value={totalRevenue} format={formatCurrency} icon={DollarSign} delay={0.15} />
                    <SummaryCard title="Outstanding" value={outstandingBalance} format={formatCurrency} icon={AlertTriangle} delay={0.2} />
                </div>

                <DataTable
                    columns={columns}
                    data={invoices}
                    keyExtractor={(inv) => inv.contractId}
                    title="Invoices"
                    emptyTitle="No invoices yet"
                    emptyDescription="Create your first invoice to get started."
                    emptyIcon={FileText}
                    emptyAction={
                        <Link to="/invoices/new" className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg no-underline">
                            <FilePlus className="h-4 w-4" /> Create Invoice
                        </Link>
                    }
                />
            </div>
        </PageTransition>
    );
};

export default SellerDashboard;
