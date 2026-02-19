import React, { useEffect, useState } from 'react'
import {
    useTenantRegistrationStore
} from '../stores/tenantRegistrationStore'
import type { TenantRegistrationRequest } from "../openapi.d.ts"
import { useToast } from '../stores/toastStore';
import api from '../api';
import { Client, FeatureFlags } from "../openapi";
import PageTransition from '../components/ui/PageTransition';
import { Trash2, Plus } from 'lucide-react';

const inputClass = 'mt-1 block w-full rounded-xl border border-zinc-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2.5 bg-white';
const labelClass = 'block text-sm font-medium text-zinc-700';

const TenantRegistrationView: React.FC = () => {
    const {
        registrations,
        fetchTenantRegistrations,
        createTenantRegistration,
        deleteTenantRegistration,
    } = useTenantRegistrationStore()

    const [formData, setFormData] = useState<TenantRegistrationRequest>({
        tenantId: '',
        partyId: '',
        clientId: '',
        issuerUrl: '',
        walletUrl: '',
        users: []
    })

    const toast = useToast();
    const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null);

    const fetchFeatureFlags = async () => {
        try {
            const client: Client = await api.getClient();
            const response = await client.getFeatureFlags();
            setFeatureFlags(response.data);
        } catch (error) {
            toast.displayError('Error fetching feature flags');
        }
    };

    useEffect(() => {
        fetchFeatureFlags();
        fetchTenantRegistrations()
    }, [fetchTenantRegistrations])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'users' ? value.split(',').map(user => user.trim()) : value,
        }))
    }

    const validate = (): string | null => {
        const t = formData.tenantId.trim()
        const p = formData.partyId.trim()
        if (!t) return 'Tenant ID is required'
        if (!p) return 'Party ID is required'

        if (featureFlags?.authMode === 'oauth2') {
            if (!formData.clientId?.trim()) return 'Client ID is required (OAuth2)'
            if (!formData.issuerUrl?.trim()) return 'Issuer URL is required (OAuth2)'
        }

        if (featureFlags?.authMode === 'shared-secret') {
            if (!formData.users || formData.users.length === 0) {
                return 'At least one user is required (Shared Secret)'
            }
        }
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const error = validate()
        if (error) {
            toast.displayError(error)
            return
        }
        await createTenantRegistration(formData)
        setFormData({
            tenantId: '',
            partyId: '',
            clientId: '',
            issuerUrl: '',
            walletUrl: '',
            users: []
        })
    }

    const handleDelete = async (tenantId: string) => {
        if (window.confirm('Are you sure you want to delete this tenant registration?')) {
            await deleteTenantRegistration(tenantId)
        }
    }

    return (
        <PageTransition>
            <div className="p-6 lg:p-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Tenant Registration</h1>
                    <p className="text-sm text-zinc-500 mt-1">Manage platform tenant registrations</p>
                </div>

                {/* Registration Form */}
                <div className="bg-white rounded-xl border border-zinc-200/60 p-6">
                    <h2 className="text-base font-semibold text-zinc-900 mb-4">Register New Tenant</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="tenantId" className={labelClass}>Tenant ID</label>
                                <input type="text" id="tenantId" name="tenantId" className={inputClass} value={formData.tenantId} onChange={handleChange} required />
                            </div>
                            <div>
                                <label htmlFor="partyId" className={labelClass}>Party ID</label>
                                <input type="text" id="partyId" name="partyId" className={inputClass} value={formData.partyId} onChange={handleChange} required />
                            </div>
                            {featureFlags?.authMode === 'oauth2' && (
                                <>
                                    <div>
                                        <label htmlFor="clientId" className={labelClass}>Client ID</label>
                                        <input type="text" id="clientId" name="clientId" className={inputClass} value={formData.clientId} onChange={handleChange} required />
                                    </div>
                                    <div>
                                        <label htmlFor="issuerUrl" className={labelClass}>Issuer URL</label>
                                        <input type="text" id="issuerUrl" name="issuerUrl" className={inputClass} value={formData.issuerUrl} onChange={handleChange} required />
                                    </div>
                                </>
                            )}
                            <div>
                                <label htmlFor="walletUrl" className={labelClass}>Wallet URL</label>
                                <input type="text" id="walletUrl" name="walletUrl" className={inputClass} value={formData.walletUrl} onChange={handleChange} />
                            </div>
                            {featureFlags?.authMode === 'shared-secret' && (
                                <div>
                                    <label htmlFor="users" className={labelClass}>Users (comma-separated)</label>
                                    <input type="text" id="users" name="users" className={inputClass} value={Array.isArray(formData.users) ? formData.users.join(', ') : (formData.users ?? '')} onChange={handleChange} />
                                </div>
                            )}
                        </div>
                        <div className="mt-4">
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Register Tenant
                            </button>
                        </div>
                    </form>
                </div>

                {/* Registrations Table */}
                <div className="bg-white rounded-xl border border-zinc-200/60 overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-200/60">
                        <h2 className="text-base font-semibold text-zinc-900">Existing Registrations</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-zinc-200/60">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tenant ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Party ID</th>
                                    {featureFlags?.authMode === 'oauth2' && (
                                        <>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Client ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Issuer URL</th>
                                        </>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Wallet URL</th>
                                    {featureFlags?.authMode === 'shared-secret' && (
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Users</th>
                                    )}
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {registrations.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-zinc-500 text-sm">
                                            No tenant registrations found.
                                        </td>
                                    </tr>
                                ) : (
                                    registrations.map((registration, index) => (
                                        <tr key={index} className="hover:bg-zinc-50/60 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-zinc-900">{registration.tenantId}</td>
                                            <td className="px-6 py-4 text-sm text-zinc-500">{registration.partyId}</td>
                                            {featureFlags?.authMode === 'oauth2' && (
                                                <>
                                                    <td className="px-6 py-4 text-sm text-zinc-500">{registration.clientId}</td>
                                                    <td className="px-6 py-4 text-sm text-zinc-500">{registration.issuerUrl}</td>
                                                </>
                                            )}
                                            <td className="px-6 py-4 text-sm text-zinc-500">{registration.walletUrl}</td>
                                            {featureFlags?.authMode === 'shared-secret' && (
                                                <td className="px-6 py-4 text-sm text-zinc-500">{registration.users}</td>
                                            )}
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    disabled={registration.internal}
                                                    onClick={() => handleDelete(registration.tenantId)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </PageTransition>
    )
}

export default TenantRegistrationView
