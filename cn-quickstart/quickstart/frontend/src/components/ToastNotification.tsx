import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useToast } from '../stores/toastStore';
import { cn } from './ui/cn';

const ToastNotification: React.FC = () => {
    const { message, show, hideError } = useToast();

    const isError = message.startsWith('Error:');
    const isSuccess = message.startsWith('Success:');

    const config = isError
        ? { icon: XCircle, bg: 'bg-red-50 border-red-200', text: 'text-red-800', iconColor: 'text-red-500' }
        : isSuccess
        ? { icon: CheckCircle, bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', iconColor: 'text-emerald-500' }
        : { icon: Info, bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', iconColor: 'text-blue-500' };

    const Icon = config.icon;
    const displayMessage = message.replace(/^(Error:|Success:|Info:)\s*/, '');

    return (
        <div className="fixed top-4 right-4 z-[9999]">
            <AnimatePresence>
                {show && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm',
                            config.bg,
                        )}
                    >
                        <Icon className={cn('h-5 w-5 flex-shrink-0', config.iconColor)} />
                        <p className={cn('text-sm font-medium flex-1', config.text)}>
                            {displayMessage}
                        </p>
                        <button
                            onClick={hideError}
                            className="rounded-lg p-1 hover:bg-black/5 transition-colors"
                        >
                            <X className="h-4 w-4 text-zinc-400" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ToastNotification;
