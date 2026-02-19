import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Trash2, Plus, ArrowLeft, Check, Loader2, Sparkles } from 'lucide-react';
import { useInvoiceStore } from '../stores/invoiceStore';
import { useUserStore } from '../stores/userStore';
import type { CreateInvoiceRequest } from '../openapi.d.ts';
import { cn } from '../components/ui/cn';
import PageTransition from '../components/ui/PageTransition';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Address {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

interface Contact {
    name: string;
    email: string;
    phone: string;
}

interface PartyInfo {
    partyName: string;
    regNumber: string;
    taxNumber: string;
    address: Address;
    contact: Contact;
}

interface LineItem {
    itemName: string;
    sku: string;
    qty: number;
    unit: string;
    unitPrice: number;
    discount: number;
    taxRate: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const emptyAddress = (): Address => ({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
});

const emptyContact = (): Contact => ({
    name: '',
    email: '',
    phone: '',
});

const emptyPartyInfo = (): PartyInfo => ({
    partyName: '',
    regNumber: '',
    taxNumber: '',
    address: emptyAddress(),
    contact: emptyContact(),
});

const emptyLineItem = (): LineItem => ({
    itemName: '',
    sku: '',
    qty: 1,
    unit: 'EA',
    unitPrice: 0,
    discount: 0,
    taxRate: 0,
});

const lineSubtotal = (item: LineItem): number => {
    const base = item.qty * item.unitPrice;
    const afterDiscount = base - item.discount;
    const tax = afterDiscount * (item.taxRate / 100);
    return afterDiscount + tax;
};

const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ------------------------------------------------------------------ */
/*  Step indicator                                                    */
/* ------------------------------------------------------------------ */

const STEPS = ['Details', 'Parties', 'Line Items', 'Review'] as const;

const StepIndicator: React.FC<{ current: number }> = ({ current }) => (
    <nav className="mb-10">
        <ol className="flex items-center justify-between">
            {STEPS.map((label, i) => {
                const done = i < current;
                const active = i === current;
                return (
                    <li key={label} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1.5">
                            <motion.div
                                className={cn(
                                    'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold border-2 transition-colors',
                                    done && 'border-indigo-600 bg-indigo-600 text-white',
                                    active && 'border-indigo-600 bg-indigo-50 text-indigo-700',
                                    !done && !active && 'border-zinc-300 bg-white text-zinc-400',
                                )}
                                initial={false}
                                animate={active ? { scale: [1, 1.12, 1] } : {}}
                                transition={{ duration: 0.35 }}
                            >
                                {done ? <Check className="h-4 w-4" /> : i + 1}
                            </motion.div>
                            <span
                                className={cn(
                                    'text-xs font-medium whitespace-nowrap',
                                    (done || active) ? 'text-indigo-700' : 'text-zinc-400',
                                )}
                            >
                                {label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className="mx-3 mt-[-1.25rem] h-0.5 flex-1 rounded-full bg-zinc-200 overflow-hidden">
                                <motion.div
                                    className="h-full bg-indigo-600"
                                    initial={false}
                                    animate={{ width: done ? '100%' : '0%' }}
                                    transition={{ duration: 0.4 }}
                                />
                            </div>
                        )}
                    </li>
                );
            })}
        </ol>
    </nav>
);

/* ------------------------------------------------------------------ */
/*  Collapsible section wrapper                                       */
/* ------------------------------------------------------------------ */

const Section: React.FC<{
    title: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}> = ({ title, defaultOpen = true, children }) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="bg-white rounded-xl border border-zinc-200/60 mb-5 overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-zinc-50 transition-colors"
            >
                <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
                <motion.span
                    animate={{ rotate: open ? 0 : -90 }}
                    transition={{ duration: 0.25 }}
                >
                    <ChevronDown className="h-5 w-5 text-zinc-500" />
                </motion.span>
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-6">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Reusable styled input / label                                     */
/* ------------------------------------------------------------------ */

const labelClass = 'block text-sm font-medium text-zinc-600 mb-1';

const inputClass =
    'block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm ' +
    'placeholder:text-zinc-400 ' +
    'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none ' +
    'transition-shadow';

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

const CreateInvoiceView: React.FC = () => {
    const navigate = useNavigate();
    const { createInvoice } = useInvoiceStore();
    const { user } = useUserStore();

    /* ---- form state ---- */
    const [description, setDescription] = useState('');
    const [currency, setCurrency] = useState('CC');
    const [dueDate, setDueDate] = useState('');
    const [paymentTerms, setPaymentTerms] = useState('');
    const [poNumber, setPoNumber] = useState('');

    const [sellerPartyId, setSellerPartyId] = useState('');
    const [sellerInfo, setSellerInfo] = useState<PartyInfo>(emptyPartyInfo());

    const [buyerPartyId, setBuyerPartyId] = useState('');
    const [buyerInfo, setBuyerInfo] = useState<PartyInfo>(emptyPartyInfo());

    const [shippingAddress, setShippingAddress] = useState<Address>(emptyAddress());

    const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem()]);

    const [notes, setNotes] = useState('');
    const [deliveryTerms, setDeliveryTerms] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    /* ---- fill sample data ---- */
    const fillSampleData = useCallback(async () => {
        setDescription('Supply Chain Demo Invoice');
        setCurrency('CC');
        const due = new Date();
        due.setDate(due.getDate() + 30);
        setDueDate(due.toISOString().slice(0, 16));
        setPaymentTerms('Net 30');
        setPoNumber('PO-2026-001');

        // Seller = user.party (the authenticated party from the backend)
        const sellerParty = user?.party || '';
        setSellerPartyId(sellerParty);
        setSellerInfo({
            partyName: 'Acme Supplies Inc.',
            regNumber: 'REG-123456',
            taxNumber: 'TAX-789012',
            address: { street: '100 Main St', city: 'Denver', state: 'CO', postalCode: '80202', country: 'US' },
            contact: { name: 'Alice Seller', email: 'alice@acme.com', phone: '+1-555-0100' },
        });

        // Fetch buyer party from /api/parties (env vars, no admin required)
        try {
            const resp = await fetch('/api/parties');
            const parties = await resp.json();
            setBuyerPartyId(parties.buyer || '');
        } catch {
            setBuyerPartyId('');
        }
        setBuyerInfo({
            partyName: 'TechCorp Ltd.',
            regNumber: 'REG-654321',
            taxNumber: 'TAX-210987',
            address: { street: '200 Market St', city: 'Boulder', state: 'CO', postalCode: '80301', country: 'US' },
            contact: { name: 'Bob Buyer', email: 'bob@techcorp.com', phone: '+1-555-0200' },
        });

        setShippingAddress({ street: '200 Market St', city: 'Boulder', state: 'CO', postalCode: '80301', country: 'US' });

        setLineItems([
            { itemName: 'Industrial Widget A', sku: 'WDG-A', qty: 10, unit: 'EA', unitPrice: 25, discount: 0, taxRate: 8 },
            { itemName: 'Premium Component B', sku: 'CMP-B', qty: 5, unit: 'EA', unitPrice: 45, discount: 10, taxRate: 8 },
        ]);

        setNotes('Demo invoice for ETHDenver hackathon');
        setDeliveryTerms('FOB Destination');
    }, [user]);

    /* ---- updaters ---- */
    const updateSellerInfo = (field: string, value: string) => {
        setSellerInfo(prev => ({ ...prev, [field]: value }));
    };

    const updateSellerAddress = (field: string, value: string) => {
        setSellerInfo(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
    };

    const updateSellerContact = (field: string, value: string) => {
        setSellerInfo(prev => ({ ...prev, contact: { ...prev.contact, [field]: value } }));
    };

    const updateBuyerInfo = (field: string, value: string) => {
        setBuyerInfo(prev => ({ ...prev, [field]: value }));
    };

    const updateBuyerAddress = (field: string, value: string) => {
        setBuyerInfo(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
    };

    const updateBuyerContact = (field: string, value: string) => {
        setBuyerInfo(prev => ({ ...prev, contact: { ...prev.contact, [field]: value } }));
    };

    const updateShippingAddress = (field: string, value: string) => {
        setShippingAddress(prev => ({ ...prev, [field]: value }));
    };

    const updateLineItem = (index: number, field: string, value: string | number) => {
        setLineItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const addLineItem = () => {
        setLineItems(prev => [...prev, emptyLineItem()]);
    };

    const removeLineItem = (index: number) => {
        setLineItems(prev => prev.filter((_, i) => i !== index));
    };

    /* ---- computed totals ---- */
    const totals = useMemo(() => {
        let subtotal = 0;
        let totalDiscount = 0;
        let totalTax = 0;
        for (const item of lineItems) {
            const base = item.qty * item.unitPrice;
            subtotal += base;
            totalDiscount += item.discount;
            const afterDiscount = base - item.discount;
            totalTax += afterDiscount * (item.taxRate / 100);
        }
        const grandTotal = subtotal - totalDiscount + totalTax;
        return { subtotal, totalDiscount, totalTax, grandTotal };
    }, [lineItems]);

    /* ---- step tracking (decorative, form is always one page) ---- */
    const currentStep = useMemo(() => {
        // Simple heuristic: show which "area" has recent focus
        // We keep all fields visible so the user can jump around,
        // but we highlight the step indicator based on filled data.
        if (lineItems.some(li => li.itemName !== '')) return 3; // Review
        if (buyerPartyId || buyerInfo.partyName) return 2;      // Line Items next
        if (sellerPartyId || sellerInfo.partyName) return 1;    // Parties
        return 0;                                                // Details
    }, [lineItems, buyerPartyId, buyerInfo.partyName, sellerPartyId, sellerInfo.partyName]);

    /* ---- submit (unchanged logic) ---- */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const request: CreateInvoiceRequest = {
                buyer: buyerPartyId,
                seller: sellerPartyId,
                description,
                currency,
                dueDate: new Date(dueDate).toISOString(),
                paymentTerms,
                poNumber,
                sellerInfo,
                buyerInfo,
                shippingAddress,
                lineItems: lineItems.map(item => ({
                    itemName: item.itemName,
                    sku: item.sku,
                    quantity: item.qty,
                    unitOfMeasure: item.unit,
                    unitPrice: item.unitPrice,
                    discount: item.discount,
                    taxRate: item.taxRate,
                })),
                notes,
                deliveryTerms,
            } as CreateInvoiceRequest;
            await createInvoice(request);
            setSubmitted(true);
            setTimeout(() => navigate('/dashboard'), 800);
        } finally {
            setSubmitting(false);
        }
    };

    /* ================================================================ */
    /*  Render                                                          */
    /* ================================================================ */

    return (
        <PageTransition>
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* Top bar */}
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-indigo-600 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                    <h1 className="text-2xl font-bold text-zinc-900">Create Invoice</h1>
                    <button
                        type="button"
                        onClick={fillSampleData}
                        className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                        <Sparkles className="h-4 w-4" />
                        Fill Sample Data
                    </button>
                </div>

                {/* Step indicator */}
                <StepIndicator current={currentStep} />

                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* -------- LEFT: form sections -------- */}
                        <div className="flex-1 min-w-0">
                            {/* Invoice Details */}
                            <Section title="Invoice Details">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClass}>Description</label>
                                        <input type="text" className={inputClass} value={description} onChange={e => setDescription(e.target.value)} required placeholder="e.g. March consulting" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Currency</label>
                                        <input type="text" className={inputClass} value={currency} onChange={e => setCurrency(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Due Date</label>
                                        <input type="datetime-local" className={inputClass} value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Payment Terms</label>
                                        <input type="text" className={inputClass} value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="e.g. Net 30" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>PO Number</label>
                                        <input type="text" className={inputClass} value={poNumber} onChange={e => setPoNumber(e.target.value)} />
                                    </div>
                                </div>
                            </Section>

                            {/* Seller Information */}
                            <Section title="Seller Information">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClass}>Seller Party ID</label>
                                        <input type="text" className={inputClass} value={sellerPartyId} onChange={e => setSellerPartyId(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Party Name</label>
                                        <input type="text" className={inputClass} value={sellerInfo.partyName} onChange={e => updateSellerInfo('partyName', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Reg Number</label>
                                        <input type="text" className={inputClass} value={sellerInfo.regNumber} onChange={e => updateSellerInfo('regNumber', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Tax Number</label>
                                        <input type="text" className={inputClass} value={sellerInfo.taxNumber} onChange={e => updateSellerInfo('taxNumber', e.target.value)} />
                                    </div>
                                </div>

                                <h3 className="text-sm font-semibold text-zinc-500 mt-5 mb-3 uppercase tracking-wider">Seller Address</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClass}>Street</label>
                                        <input type="text" className={inputClass} value={sellerInfo.address.street} onChange={e => updateSellerAddress('street', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>City</label>
                                        <input type="text" className={inputClass} value={sellerInfo.address.city} onChange={e => updateSellerAddress('city', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>State</label>
                                        <input type="text" className={inputClass} value={sellerInfo.address.state} onChange={e => updateSellerAddress('state', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Postal Code</label>
                                        <input type="text" className={inputClass} value={sellerInfo.address.postalCode} onChange={e => updateSellerAddress('postalCode', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Country</label>
                                        <input type="text" className={inputClass} value={sellerInfo.address.country} onChange={e => updateSellerAddress('country', e.target.value)} />
                                    </div>
                                </div>

                                <h3 className="text-sm font-semibold text-zinc-500 mt-5 mb-3 uppercase tracking-wider">Seller Contact</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClass}>Name</label>
                                        <input type="text" className={inputClass} value={sellerInfo.contact.name} onChange={e => updateSellerContact('name', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Email</label>
                                        <input type="email" className={inputClass} value={sellerInfo.contact.email} onChange={e => updateSellerContact('email', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Phone</label>
                                        <input type="tel" className={inputClass} value={sellerInfo.contact.phone} onChange={e => updateSellerContact('phone', e.target.value)} />
                                    </div>
                                </div>
                            </Section>

                            {/* Buyer Information */}
                            <Section title="Buyer Information">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClass}>Buyer Party ID</label>
                                        <input type="text" className={inputClass} value={buyerPartyId} onChange={e => setBuyerPartyId(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Party Name</label>
                                        <input type="text" className={inputClass} value={buyerInfo.partyName} onChange={e => updateBuyerInfo('partyName', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Reg Number</label>
                                        <input type="text" className={inputClass} value={buyerInfo.regNumber} onChange={e => updateBuyerInfo('regNumber', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Tax Number</label>
                                        <input type="text" className={inputClass} value={buyerInfo.taxNumber} onChange={e => updateBuyerInfo('taxNumber', e.target.value)} />
                                    </div>
                                </div>

                                <h3 className="text-sm font-semibold text-zinc-500 mt-5 mb-3 uppercase tracking-wider">Buyer Address</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClass}>Street</label>
                                        <input type="text" className={inputClass} value={buyerInfo.address.street} onChange={e => updateBuyerAddress('street', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>City</label>
                                        <input type="text" className={inputClass} value={buyerInfo.address.city} onChange={e => updateBuyerAddress('city', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>State</label>
                                        <input type="text" className={inputClass} value={buyerInfo.address.state} onChange={e => updateBuyerAddress('state', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Postal Code</label>
                                        <input type="text" className={inputClass} value={buyerInfo.address.postalCode} onChange={e => updateBuyerAddress('postalCode', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Country</label>
                                        <input type="text" className={inputClass} value={buyerInfo.address.country} onChange={e => updateBuyerAddress('country', e.target.value)} />
                                    </div>
                                </div>

                                <h3 className="text-sm font-semibold text-zinc-500 mt-5 mb-3 uppercase tracking-wider">Buyer Contact</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClass}>Name</label>
                                        <input type="text" className={inputClass} value={buyerInfo.contact.name} onChange={e => updateBuyerContact('name', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Email</label>
                                        <input type="email" className={inputClass} value={buyerInfo.contact.email} onChange={e => updateBuyerContact('email', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Phone</label>
                                        <input type="tel" className={inputClass} value={buyerInfo.contact.phone} onChange={e => updateBuyerContact('phone', e.target.value)} />
                                    </div>
                                </div>
                            </Section>

                            {/* Shipping Address */}
                            <Section title="Shipping Address" defaultOpen={false}>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClass}>Street</label>
                                        <input type="text" className={inputClass} value={shippingAddress.street} onChange={e => updateShippingAddress('street', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>City</label>
                                        <input type="text" className={inputClass} value={shippingAddress.city} onChange={e => updateShippingAddress('city', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>State</label>
                                        <input type="text" className={inputClass} value={shippingAddress.state} onChange={e => updateShippingAddress('state', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Postal Code</label>
                                        <input type="text" className={inputClass} value={shippingAddress.postalCode} onChange={e => updateShippingAddress('postalCode', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Country</label>
                                        <input type="text" className={inputClass} value={shippingAddress.country} onChange={e => updateShippingAddress('country', e.target.value)} />
                                    </div>
                                </div>
                            </Section>

                            {/* Line Items */}
                            <Section title="Line Items">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm text-zinc-500">
                                        {lineItems.length} item{lineItems.length !== 1 && 's'}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={addLineItem}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Item
                                    </button>
                                </div>

                                <div className="overflow-x-auto -mx-6 px-6">
                                    <table className="min-w-full divide-y divide-zinc-200">
                                        <thead>
                                            <tr className="bg-zinc-50/80">
                                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Item Name</th>
                                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">SKU</th>
                                                <th className="px-3 py-2.5 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Qty</th>
                                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Unit</th>
                                                <th className="px-3 py-2.5 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Unit Price</th>
                                                <th className="px-3 py-2.5 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Discount</th>
                                                <th className="px-3 py-2.5 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tax %</th>
                                                <th className="px-3 py-2.5 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Subtotal</th>
                                                <th className="px-3 py-2.5 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100">
                                            <AnimatePresence initial={false}>
                                                {lineItems.map((item, index) => (
                                                    <motion.tr
                                                        key={index}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 20, height: 0 }}
                                                        transition={{ duration: 0.25 }}
                                                        className="group"
                                                    >
                                                        <td className="px-2 py-2">
                                                            <input
                                                                type="text"
                                                                className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-shadow"
                                                                value={item.itemName}
                                                                onChange={e => updateLineItem(index, 'itemName', e.target.value)}
                                                                placeholder="Item name"
                                                                required
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input
                                                                type="text"
                                                                className="w-24 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-shadow"
                                                                value={item.sku}
                                                                onChange={e => updateLineItem(index, 'sku', e.target.value)}
                                                                placeholder="SKU"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                step="1"
                                                                className="w-16 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-right focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-shadow"
                                                                value={item.qty}
                                                                onChange={e => updateLineItem(index, 'qty', parseInt(e.target.value) || 0)}
                                                                required
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input
                                                                type="text"
                                                                className="w-16 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-shadow"
                                                                value={item.unit}
                                                                onChange={e => updateLineItem(index, 'unit', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                className="w-24 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-right focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-shadow"
                                                                value={item.unitPrice}
                                                                onChange={e => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                                required
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                className="w-20 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-right focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-shadow"
                                                                value={item.discount}
                                                                onChange={e => updateLineItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                className="w-20 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-right focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-shadow"
                                                                value={item.taxRate}
                                                                onChange={e => updateLineItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2 text-right text-sm font-medium text-zinc-900 whitespace-nowrap">
                                                            {fmt(lineSubtotal(item))}
                                                        </td>
                                                        <td className="px-2 py-2 text-center">
                                                            {lineItems.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeLineItem(index)}
                                                                    className="p-1.5 rounded-lg text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all"
                                                                    title="Remove item"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                            </Section>

                            {/* Additional Information */}
                            <Section title="Additional Information" defaultOpen={false}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Notes</label>
                                        <textarea
                                            className={inputClass}
                                            rows={3}
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            placeholder="Any additional notes..."
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Delivery Terms</label>
                                        <textarea
                                            className={inputClass}
                                            rows={3}
                                            value={deliveryTerms}
                                            onChange={e => setDeliveryTerms(e.target.value)}
                                            placeholder="e.g. FOB Destination"
                                        />
                                    </div>
                                </div>
                            </Section>

                            {/* Submit buttons (visible below form on all sizes) */}
                            <div className="flex items-center justify-end gap-3 pt-2 pb-8">
                                <button
                                    type="button"
                                    onClick={() => navigate('/dashboard')}
                                    className="rounded-xl border border-zinc-300 bg-white px-6 py-2.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitting || submitted}
                                    className={cn(
                                        'relative inline-flex items-center justify-center gap-2 rounded-xl px-7 py-2.5 text-sm font-medium text-white shadow-sm transition-all',
                                        submitted
                                            ? 'bg-green-600'
                                            : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]',
                                        (submitting || submitted) && 'cursor-not-allowed opacity-90',
                                    )}
                                >
                                    <AnimatePresence mode="wait" initial={false}>
                                        {submitted ? (
                                            <motion.span
                                                key="done"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="inline-flex items-center gap-1.5"
                                            >
                                                <Check className="h-4 w-4" />
                                                Created!
                                            </motion.span>
                                        ) : submitting ? (
                                            <motion.span
                                                key="spin"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="inline-flex items-center gap-1.5"
                                            >
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Creating...
                                            </motion.span>
                                        ) : (
                                            <motion.span
                                                key="idle"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                Create Invoice
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </button>
                            </div>
                        </div>

                        {/* -------- RIGHT: sticky totals panel -------- */}
                        <div className="lg:w-72 flex-shrink-0">
                            <div className="lg:sticky lg:top-8">
                                <motion.div
                                    className="bg-white rounded-xl border border-zinc-200/60 p-6"
                                    layout
                                >
                                    <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-4">
                                        Summary
                                    </h3>

                                    <dl className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <dt className="text-zinc-500">Subtotal</dt>
                                            <dd className="font-medium text-zinc-900">
                                                {fmt(totals.subtotal)} {currency}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-zinc-500">Discount</dt>
                                            <dd className="font-medium text-red-600">
                                                -{fmt(totals.totalDiscount)} {currency}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-zinc-500">Tax</dt>
                                            <dd className="font-medium text-zinc-900">
                                                {fmt(totals.totalTax)} {currency}
                                            </dd>
                                        </div>

                                        <div className="border-t border-zinc-200 pt-3 mt-3">
                                            <div className="flex justify-between">
                                                <dt className="text-base font-semibold text-zinc-900">Grand Total</dt>
                                                <motion.dd
                                                    key={totals.grandTotal}
                                                    initial={{ scale: 1.08, color: '#4f46e5' }}
                                                    animate={{ scale: 1, color: '#111827' }}
                                                    transition={{ duration: 0.35 }}
                                                    className="text-base font-bold"
                                                >
                                                    {fmt(totals.grandTotal)} {currency}
                                                </motion.dd>
                                            </div>
                                        </div>
                                    </dl>

                                    {/* Line-item count badge */}
                                    <div className="mt-5 pt-4 border-t border-zinc-100">
                                        <p className="text-xs text-zinc-400">
                                            {lineItems.length} line item{lineItems.length !== 1 && 's'}
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </PageTransition>
    );
};

export default CreateInvoiceView;
