import React, { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useUserStore } from '../stores/userStore';
import {
    FileText,
    Shield,
    Truck,
    Calculator,
    ArrowRight,
    Zap,
    Eye,
    EyeOff,
    Lock,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

const ease = [0.25, 0.1, 0.25, 1.0] as const;

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease },
    }),
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const privacyCards = [
    {
        title: 'Full Invoice',
        subtitle: 'Seller, Buyer, Provider',
        desc: 'Complete details including line items, prices, contacts, shipping addresses, and financial totals.',
        Icon: Eye,
    },
    {
        title: 'Logistics View',
        subtitle: 'Carrier',
        desc: 'Shipping addresses, item names, and quantities only. Zero price fields exist on their node.',
        Icon: Truck,
    },
    {
        title: 'Financial View',
        subtitle: 'Bookkeeper',
        desc: 'Invoice totals, tax breakdown, and payment status only. Zero contact details or addresses.',
        Icon: Calculator,
    },
];

const steps = [
    {
        num: '1',
        title: 'Seller Creates Invoice',
        desc: 'A full invoice is created with line items, tax, shipping, and payment terms. Canton automatically generates privacy-scoped views.',
        Icon: FileText,
    },
    {
        num: '2',
        title: 'Buyer Pays',
        desc: 'Canton Coin payment is processed via Splice wallet. The buyer sees full invoice details and confirms payment on-ledger.',
        Icon: Shield,
    },
    {
        num: '3',
        title: 'Carrier Ships',
        desc: 'The logistics provider receives only shipping data. Prices, totals, and financial details never touch their node.',
        Icon: Truck,
    },
    {
        num: '4',
        title: 'Bookkeeper Audits',
        desc: 'The finance party sees totals, tax breakdowns, and payment status. Personal addresses and contact info are cryptographically excluded.',
        Icon: Calculator,
    },
];

/* ================================================================== */
/*  LandingPage                                                        */
/* ================================================================== */

const LandingPage: React.FC = () => {
    const { user, fetchUser } = useUserStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    useEffect(() => {
        if (user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const privacyRef = useRef<HTMLDivElement>(null);
    const privacyInView = useInView(privacyRef, { once: true, margin: '-80px' });

    const stepsRef = useRef<HTMLDivElement>(null);
    const stepsInView = useInView(stepsRef, { once: true, margin: '-80px' });

    const ctaRef = useRef<HTMLDivElement>(null);
    const ctaInView = useInView(ctaRef, { once: true, margin: '-80px' });

    return (
        <div className="min-h-screen overflow-hidden">
            {/* ── HERO ─────────────────────────────────────────── */}
            <section className="relative bg-zinc-950 text-white py-32 px-6 overflow-hidden">
                {/* Gradient mesh */}
                <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-violet-500/15 blur-[120px] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />

                {/* Grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

                <div className="relative max-w-4xl mx-auto text-center z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease }}
                    >
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-8">
                            <Zap className="h-3 w-3" />
                            Built on Canton Network
                        </span>
                    </motion.div>

                    <motion.h1
                        className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.6, ease }}
                    >
                        Privacy-First Invoicing
                    </motion.h1>

                    <motion.p
                        className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6, ease }}
                    >
                        One invoice, five parties, four different views — enforced
                        cryptographically by Canton's sub-transaction privacy.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5, ease }}
                        className="flex gap-4 justify-center"
                    >
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm transition-colors duration-150 no-underline group"
                        >
                            Launch App
                            <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* ── PRIVACY VISUALIZATION ────────────────────────── */}
            <section className="py-24 px-6 bg-white" ref={privacyRef}>
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 12 }}
                        animate={privacyInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, ease }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight mb-4">
                            Same Invoice, Different Views
                        </h2>
                        <p className="text-zinc-500 max-w-xl mx-auto">
                            Canton's sub-transaction privacy ensures each party sees only the
                            data they need — cryptographically enforced at the ledger level.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {privacyCards.map((card, i) => (
                            <motion.div
                                key={card.title}
                                className="bg-white rounded-xl border border-zinc-200/60 p-6 hover:border-zinc-300 transition-colors duration-150"
                                custom={i}
                                variants={fadeUp}
                                initial="hidden"
                                animate={privacyInView ? 'visible' : 'hidden'}
                            >
                                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center mb-4">
                                    <card.Icon className="w-5 h-5 text-zinc-600" />
                                </div>
                                <h3 className="text-base font-semibold text-zinc-900 mb-1">
                                    {card.title}
                                </h3>
                                <p className="text-xs font-medium text-zinc-400 mb-3">
                                    {card.subtitle}
                                </p>
                                <p className="text-sm text-zinc-500 leading-relaxed">
                                    {card.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ─────────────────────────────────── */}
            <section className="py-24 px-6 bg-zinc-50" ref={stepsRef}>
                <div className="max-w-2xl mx-auto">
                    <motion.h2
                        className="text-3xl md:text-4xl font-bold text-center text-zinc-900 tracking-tight mb-16"
                        initial={{ opacity: 0, y: 12 }}
                        animate={stepsInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, ease }}
                    >
                        How It Works
                    </motion.h2>

                    <div className="relative">
                        <div className="absolute left-5 top-0 bottom-0 w-px bg-zinc-200 hidden md:block" />

                        <div className="space-y-10">
                            {steps.map((step, i) => (
                                <motion.div
                                    key={step.num}
                                    className="relative flex items-start gap-5"
                                    custom={i}
                                    variants={fadeUp}
                                    initial="hidden"
                                    animate={stepsInView ? 'visible' : 'hidden'}
                                >
                                    <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-sm font-semibold text-zinc-700">
                                        {step.num}
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <step.Icon className="w-4 h-4 text-zinc-400" />
                                            <h3 className="text-sm font-semibold text-zinc-900">
                                                {step.title}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-zinc-500 leading-relaxed">
                                            {step.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── PRIVACY CTA ──────────────────────────────────── */}
            <section className="py-24 px-6 bg-zinc-950 text-white relative overflow-hidden" ref={ctaRef}>
                <div className="absolute top-[-80px] right-[-60px] w-[300px] h-[300px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />

                <div className="relative max-w-4xl mx-auto z-10">
                    <motion.div
                        className="text-center mb-12"
                        initial={{ opacity: 0, y: 12 }}
                        animate={ctaInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, ease }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
                            <Lock className="w-3 w-3" />
                            Sub-Transaction Privacy
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                            Structural Privacy, Not Filtering
                        </h2>
                        <p className="text-zinc-400 max-w-xl mx-auto leading-relaxed">
                            The Carrier's node literally does not have price data.
                            The Bookkeeper's node literally does not have shipping addresses.
                        </p>
                    </motion.div>

                    <motion.div
                        className="grid md:grid-cols-3 gap-4"
                        initial={{ opacity: 0, y: 12 }}
                        animate={ctaInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.15, duration: 0.5, ease }}
                    >
                        {[
                            {
                                Icon: EyeOff,
                                title: 'Data Never Transmitted',
                                desc: 'Private sub-transactions are never sent to unauthorized participants.',
                            },
                            {
                                Icon: Zap,
                                title: 'No Key Compromise Risk',
                                desc: 'Even if a node is breached, excluded data cannot be recovered.',
                            },
                            {
                                Icon: Shield,
                                title: 'Ledger-Level Enforcement',
                                desc: 'Privacy is enforced by the protocol, not by application logic.',
                            },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="bg-white/5 border border-white/10 rounded-xl p-6"
                            >
                                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4">
                                    <item.Icon className="w-4 h-4 text-indigo-400" />
                                </div>
                                <h3 className="text-sm font-semibold text-white mb-1.5">{item.title}</h3>
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── FOOTER ───────────────────────────────────────── */}
            <footer className="py-6 px-6 bg-zinc-950 border-t border-white/5 text-center">
                <p className="text-xs text-zinc-500">
                    Built for ETHDenver 2025 — Canton Network Privacy Track
                </p>
            </footer>
        </div>
    );
};

export default LandingPage;
