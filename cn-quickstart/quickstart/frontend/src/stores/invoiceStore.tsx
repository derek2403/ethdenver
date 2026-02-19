import React, { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from './toastStore';
import api from '../api';
import { generateCommandId } from '../utils/commandId';
import type {
    Client,
    InvoiceResponse,
    CreateInvoiceRequest,
    RequestPaymentRequest,
    CompletePaymentRequest,
    InvoicePaymentResult,
    CancelRequest,
} from '../openapi.d.ts';
import { withErrorHandling } from "../utils/error";

interface InvoiceState {
    invoices: InvoiceResponse[];
}

interface InvoiceContextType extends InvoiceState {
    fetchInvoices: () => Promise<void>;
    createInvoice: (request: CreateInvoiceRequest) => Promise<void>;
    requestPayment: (contractId: string, request: RequestPaymentRequest) => Promise<void>;
    completePayment: (contractId: string, paymentRequestContractId: string, allocationContractId: string) => Promise<InvoicePaymentResult | void>;
    markPaid: (contractId: string) => Promise<void>;
    cancelInvoice: (contractId: string, description: string) => Promise<void>;
    withdrawPaymentRequest: (contractId: string) => Promise<void>;
    shareWithCarrier: (contractId: string, carrier: string) => Promise<void>;
    shareWithBookkeeper: (contractId: string, bookkeeper: string) => Promise<void>;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const InvoiceProvider = ({ children }: { children: React.ReactNode }) => {
    const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
    const toast = useToast();

    const fetchInvoices = useCallback(
        withErrorHandling(`Fetching Invoices`)(async () => {
            const client: Client = await api.getClient();
            const response = await client.listInvoices();
            setInvoices(response.data);
        }), [withErrorHandling, setInvoices, toast]);

    const createInvoice = useCallback(
        withErrorHandling(`Creating Invoice`)(async (request: CreateInvoiceRequest) => {
            const client: Client = await api.getClient();
            const commandId = generateCommandId();
            await client.createInvoice({ commandId }, request);
            await fetchInvoices();
            toast.displaySuccess('Invoice created successfully');
        }),
        [withErrorHandling, fetchInvoices, toast]
    );

    const requestPayment = useCallback(
        withErrorHandling(`Requesting Invoice Payment`)(async (contractId: string, request: RequestPaymentRequest) => {
            const client: Client = await api.getClient();
            const commandId = generateCommandId();
            await client.requestInvoicePayment({ contractId, commandId }, request);
            await fetchInvoices();
            toast.displaySuccess('Payment request created successfully');
        }),
        [withErrorHandling, fetchInvoices, toast]
    );

    const completePayment = useCallback(
        withErrorHandling(`Completing Invoice Payment`)(async (contractId: string, paymentRequestContractId: string, allocationContractId: string) => {
            const client: Client = await api.getClient();
            const commandId = generateCommandId();
            const request: CompletePaymentRequest = {
                paymentRequestContractId,
                allocationContractId,
            };
            const result = await client.completeInvoicePayment({ contractId, commandId }, request);
            await fetchInvoices();
            toast.displaySuccess('Invoice payment completed successfully');
            return result.data;
        }),
        [withErrorHandling, fetchInvoices, toast]
    );

    const markPaid = useCallback(
        withErrorHandling(`Marking Invoice as Paid`)(async (contractId: string) => {
            const client: Client = await api.getClient();
            const commandId = generateCommandId();
            await client.markInvoicePaid({ contractId, commandId });
            await fetchInvoices();
            toast.displaySuccess('Invoice marked as paid');
        }),
        [withErrorHandling, fetchInvoices, toast]
    );

    const cancelInvoice = useCallback(
        withErrorHandling(`Cancelling Invoice`)(async (contractId: string, description: string) => {
            const client: Client = await api.getClient();
            const commandId = generateCommandId();
            const request: CancelRequest = { meta: { data: { description: description.trim() } } };
            await client.cancelInvoice({ contractId, commandId }, request);
            await fetchInvoices();
            toast.displaySuccess('Invoice cancelled successfully');
        }),
        [withErrorHandling, fetchInvoices, toast]
    );

    const withdrawPaymentRequest = useCallback(
        withErrorHandling(`Withdrawing payment request`)(async (contractId: string) => {
            const client: Client = await api.getClient();
            const commandId = generateCommandId();
            await client.withdrawInvoicePaymentRequest({ contractId, commandId });
            await fetchInvoices();
            toast.displaySuccess('Payment request withdrawn successfully');
        }),
        [withErrorHandling, fetchInvoices, toast]
    );

    const shareWithCarrier = useCallback(
        withErrorHandling(`Sharing with carrier`)(async (contractId: string, carrier: string) => {
            const client: Client = await api.getClient();
            const commandId = generateCommandId();
            await client.shareWithCarrier({ contractId, commandId }, { carrier });
            await fetchInvoices();
            toast.displaySuccess('Shared with carrier');
        }),
        [withErrorHandling, fetchInvoices, toast]
    );

    const shareWithBookkeeper = useCallback(
        withErrorHandling(`Sharing with bookkeeper`)(async (contractId: string, bookkeeper: string) => {
            const client: Client = await api.getClient();
            const commandId = generateCommandId();
            await client.shareWithBookkeeper({ contractId, commandId }, { bookkeeper });
            await fetchInvoices();
            toast.displaySuccess('Shared with bookkeeper');
        }),
        [withErrorHandling, fetchInvoices, toast]
    );

    return (
        <InvoiceContext.Provider
            value={{
                invoices,
                fetchInvoices,
                createInvoice,
                requestPayment,
                completePayment,
                markPaid,
                cancelInvoice,
                withdrawPaymentRequest,
                shareWithCarrier,
                shareWithBookkeeper,
            }}
        >
            {children}
        </InvoiceContext.Provider>
    );
};

export const useInvoiceStore = () => {
    const context = useContext(InvoiceContext);
    if (context === undefined) {
        throw new Error('useInvoiceStore must be used within an InvoiceProvider');
    }
    return context;
};
