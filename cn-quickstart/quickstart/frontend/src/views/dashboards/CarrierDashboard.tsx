import React, { useEffect } from 'react';
import { Truck, Package, CheckCircle } from 'lucide-react';
import { useDisclosureStore } from '../../stores/disclosureStore';
import type { LogisticsViewResponse, LogisticsItemResponse } from '../../openapi.d.ts';
import PageTransition from '../../components/ui/PageTransition';
import SummaryCard from '../../components/ui/SummaryCard';
import DataTable, { type Column } from '../../components/ui/DataTable';
import PrivacyBanner from '../../components/ui/PrivacyBanner';

const CarrierDashboard: React.FC = () => {
    const { logisticsViews, fetchLogisticsViews, acknowledgeLogisticsView } = useDisclosureStore();

    useEffect(() => {
        fetchLogisticsViews();
        const interval = setInterval(fetchLogisticsViews, 5000);
        return () => clearInterval(interval);
    }, [fetchLogisticsViews]);

    const totalShipments = logisticsViews.length;

    const columns: Column<LogisticsViewResponse>[] = [
        { key: 'orderRef', header: 'Order Ref', render: (v) => <span className="text-sm font-medium text-zinc-900">{v.orderRef || '--'}</span> },
        { key: 'shipFrom', header: 'Ship From', render: (v) => <span className="text-sm text-zinc-500">{v.shipFromAddress ? `${v.shipFromAddress.city || ''}, ${v.shipFromAddress.state || ''}` : '--'}</span> },
        { key: 'shipTo', header: 'Ship To', render: (v) => <span className="text-sm text-zinc-500">{v.shipToAddress ? `${v.shipToAddress.city || ''}, ${v.shipToAddress.state || ''}` : '--'}</span> },
        { key: 'items', header: 'Items', render: (v) => (
            <ul className="list-none space-y-0.5">
                {(v.items || []).map((item: LogisticsItemResponse, idx: number) => (
                    <li key={idx} className="text-sm text-zinc-500"><span className="font-medium text-zinc-900">{item.itemName}</span> x {item.quantity}</li>
                ))}
            </ul>
        )},
        { key: 'terms', header: 'Delivery Terms', render: (v) => <span className="text-sm text-zinc-500">{v.deliveryTerms || '--'}</span> },
        { key: 'actions', header: '', align: 'right', render: (v) => (
            <button onClick={() => acknowledgeLogisticsView(v.contractId)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition-colors duration-150">
                <CheckCircle className="h-3.5 w-3.5" /> Acknowledge
            </button>
        )},
    ];

    return (
        <PageTransition>
            <div className="p-6 lg:p-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Carrier Dashboard</h1>
                    <p className="text-sm text-zinc-500 mt-1">Logistics and shipment tracking</p>
                </div>

                <PrivacyBanner role="logistics" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SummaryCard title="Active Shipments" value={totalShipments} icon={Truck} delay={0} />
                    <SummaryCard title="Total Items" value={logisticsViews.reduce((sum, v) => sum + (v.items || []).length, 0)} icon={Package} delay={0.05} />
                </div>

                <DataTable
                    columns={columns}
                    data={logisticsViews}
                    keyExtractor={(v) => v.contractId}
                    title="Shipment Details"
                    emptyTitle="No shipment data available"
                    emptyDescription="Shipment information will appear here when shared by a seller."
                    emptyIcon={Truck}
                />
            </div>
        </PageTransition>
    );
};

export default CarrierDashboard;
