import React, { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from './toastStore';
import api from '../api';
import { generateCommandId } from '../utils/commandId';
import type {
    Client,
    LogisticsViewResponse,
    BookkeeperViewResponse,
} from '../openapi.d.ts';
import { withErrorHandling } from "../utils/error";

interface DisclosureState {
    logisticsViews: LogisticsViewResponse[];
    bookkeeperViews: BookkeeperViewResponse[];
}

interface DisclosureContextType extends DisclosureState {
    fetchLogisticsViews: () => Promise<void>;
    acknowledgeLogisticsView: (contractId: string) => Promise<void>;
    revokeLogisticsView: (contractId: string) => Promise<void>;
    fetchBookkeeperViews: () => Promise<void>;
    acknowledgeBookkeeperView: (contractId: string) => Promise<void>;
    revokeBookkeeperView: (contractId: string) => Promise<void>;
}

const DisclosureContext = createContext<DisclosureContextType | undefined>(undefined);

export const DisclosureProvider = ({ children }: { children: React.ReactNode }) => {
    const [logisticsViews, setLogisticsViews] = useState<LogisticsViewResponse[]>([]);
    const [bookkeeperViews, setBookkeeperViews] = useState<BookkeeperViewResponse[]>([]);
    const toast = useToast();

    const fetchLogisticsViews = useCallback(
        withErrorHandling(`Fetching Logistics Views`)(async () => {
            const client: Client = await api.getClient();
            const response = await client.listLogisticsViews();
            setLogisticsViews(response.data);
        }), [withErrorHandling, setLogisticsViews, toast]);

    const acknowledgeLogisticsView = useCallback(
        withErrorHandling(`Acknowledging Logistics View`)(async (contractId: string) => {
            const client: Client = await api.getClient();
            const commandId = generateCommandId();
            await client.acknowledgeLogisticsView({ contractId, commandId });
            await fetchLogisticsViews();
            toast.displaySuccess('Logistics view acknowledged');
        }),
        [withErrorHandling, fetchLogisticsViews, toast]
    );

    const revokeLogisticsView = useCallback(
        withErrorHandling(`Revoking Logistics View`)(async (contractId: string) => {
            const client: Client = await api.getClient();
            const commandId = generateCommandId();
            await client.revokeLogisticsView({ contractId, commandId });
            await fetchLogisticsViews();
        }),
        [withErrorHandling, fetchLogisticsViews, toast]
    );

    const fetchBookkeeperViews = useCallback(
        withErrorHandling(`Fetching Bookkeeper Views`)(async () => {
            const client: Client = await api.getClient();
            const response = await client.listBookkeeperViews();
            setBookkeeperViews(response.data);
        }), [withErrorHandling, setBookkeeperViews, toast]);

    const acknowledgeBookkeeperView = useCallback(
        withErrorHandling(`Acknowledging Bookkeeper View`)(async (contractId: string) => {
            const client: Client = await api.getClient();
            const commandId = generateCommandId();
            await client.acknowledgeBookkeeperView({ contractId, commandId });
            await fetchBookkeeperViews();
            toast.displaySuccess('Bookkeeper view acknowledged');
        }),
        [withErrorHandling, fetchBookkeeperViews, toast]
    );

    const revokeBookkeeperView = useCallback(
        withErrorHandling(`Revoking Bookkeeper View`)(async (contractId: string) => {
            const client: Client = await api.getClient();
            const commandId = generateCommandId();
            await client.revokeBookkeeperView({ contractId, commandId });
            await fetchBookkeeperViews();
        }),
        [withErrorHandling, fetchBookkeeperViews, toast]
    );

    return (
        <DisclosureContext.Provider
            value={{
                logisticsViews,
                bookkeeperViews,
                fetchLogisticsViews,
                acknowledgeLogisticsView,
                revokeLogisticsView,
                fetchBookkeeperViews,
                acknowledgeBookkeeperView,
                revokeBookkeeperView,
            }}
        >
            {children}
        </DisclosureContext.Provider>
    );
};

export const useDisclosureStore = () => {
    const context = useContext(DisclosureContext);
    if (context === undefined) {
        throw new Error('useDisclosureStore must be used within a DisclosureProvider');
    }
    return context;
};
