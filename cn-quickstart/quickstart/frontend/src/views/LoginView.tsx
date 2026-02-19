import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { ROLES } from '../components/ui/roles';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 6 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.2, ease: 'easeOut' as const },
    },
};

const roleKeys = ['app-provider', 'seller', 'buyer', 'logistics', 'finance'] as const;

const LoginView: React.FC = () => {
    return (
        <div className="min-h-screen flex">
            {/* Left panel — branding */}
            <div className="hidden lg:flex lg:w-[45%] bg-zinc-950 relative overflow-hidden items-center justify-center p-12">
                {/* Gradient mesh */}
                <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
                <div className="absolute bottom-1/3 -right-1/4 w-1/2 h-1/2 rounded-full bg-violet-500/10 blur-[100px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

                <div className="relative z-10 max-w-sm">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="rounded-lg p-1.5 bg-indigo-600">
                            <Zap className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-semibold text-white text-sm tracking-tight">Canton Invoice</span>
                    </div>
                    <blockquote className="text-lg text-zinc-300 leading-relaxed font-light">
                        "Canton's sub-transaction privacy means each party's node only
                        contains the data they're authorized to see — cryptographically enforced."
                    </blockquote>
                    <p className="mt-4 text-xs text-zinc-500">
                        Privacy-First Invoicing Demo
                    </p>
                </div>
            </div>

            {/* Right panel — login */}
            <div className="flex-1 flex items-center justify-center p-6 bg-zinc-50">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 lg:hidden mb-4">
                        <div className="rounded-lg p-1.5 bg-indigo-600">
                            <Zap className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-semibold text-zinc-900 text-sm tracking-tight">Canton Invoice</span>
                    </div>

                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
                            Sign in
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1">
                            Select a role to explore the privacy demo
                        </p>
                    </div>

                    <motion.div
                        className="space-y-3"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {roleKeys.map((key) => {
                            const role = ROLES[key];
                            const Icon = role.icon;

                            return (
                                <motion.div key={key} variants={cardVariants}>
                                    <form action="login/shared-secret" method="POST">
                                        <input type="hidden" name="username" value={key} />
                                        <button
                                            type="submit"
                                            className="w-full flex items-center gap-4 bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl px-5 py-4 text-left cursor-pointer transition-colors duration-150"
                                        >
                                            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center">
                                                <Icon className="w-4 h-4 text-zinc-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-zinc-900">
                                                    {role.label}
                                                </div>
                                                <div className="text-xs text-zinc-500">
                                                    {role.description}
                                                </div>
                                            </div>
                                        </button>
                                    </form>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    <p className="text-center text-xs text-zinc-400">
                        Each role demonstrates a different privacy view of the same invoice data
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
