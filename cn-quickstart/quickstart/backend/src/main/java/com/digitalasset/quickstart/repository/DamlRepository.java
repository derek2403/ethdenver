// Copyright (c) 2026, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: 0BSD

package com.digitalasset.quickstart.repository;

import com.digitalasset.quickstart.pqs.Contract;
import com.digitalasset.quickstart.pqs.Pqs;
import com.digitalasset.transcode.java.ContractId;
import com.digitalasset.transcode.java.Template;
import com.digitalasset.transcode.java.Utils;

import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import quickstart_invoicing.invoicing.disclosure.LogisticsView;
import quickstart_invoicing.invoicing.disclosure.BookkeeperView;
import quickstart_invoicing.invoicing.invoice.Invoice;
import quickstart_invoicing.invoicing.invoice.InvoicePaymentRequest;
import splice_api_token_allocation_request_v1.splice.api.token.allocationrequestv1.AllocationRequest;
import splice_api_token_allocation_v1.splice.api.token.allocationv1.Allocation;

/**
 * Repository for accessing active Daml contracts via PQS.
 */
@Repository
public class DamlRepository {

    private final Pqs pqs;

    @Autowired
    public DamlRepository(Pqs pqs) {
        this.pqs = pqs;
    }

    private <T extends Template> T extractPayload(Class<T> clazz, String payload) {
        return clazz.cast(pqs.getJson2Dto().template(Utils.getTemplateIdByClass(clazz)).convert(payload));
    }

    private <T extends Template> Contract<T> extract(Class<T> clazz, ContractId<T> cid, String payload) {
        return new Contract<>(cid, extractPayload(clazz, payload));
    }

    private <T extends Template> Optional<ContractId<T>> optionalCid(Class<T> clazz, String cid) {
        return Optional.ofNullable(cid).map(ContractId<T>::new);
    }

    private <T extends Template> ContractId<T> cid(Class<T> clazz, String cid) {
        return new ContractId<T>(cid);
    }

    private <T extends Template> String qualifiedName(Class<T> clazz) {
        return Utils.getTemplateIdByClass(clazz).qualifiedName();
    }

    public CompletableFuture<Optional<Contract<AllocationRequest>>> findActiveAllocationRequestById(String contractId) {
        return pqs.contractByContractId(AllocationRequest.class, contractId);
    }

    // ── Invoice queries ─────────────────────────────────────────────

    public record InvoicePaymentRequestWithAllocationCid(
            Contract<InvoicePaymentRequest> request,
            Optional<ContractId<Allocation>> allocationCid) {
    }

    public record InvoiceWithPaymentRequests(
            Contract<Invoice> invoice,
            List<InvoicePaymentRequestWithAllocationCid> paymentRequests) {
    }

    public CompletableFuture<List<InvoiceWithPaymentRequests>> findActiveInvoices(String party) {
        var map = new HashMap<String, InvoiceWithPaymentRequests>();
        String sql = """
                SELECT invoice.contract_id    AS invoice_contract_id,
                       invoice.payload        AS invoice_payload,
                       pmtreq.contract_id     AS pmtreq_contract_id,
                       pmtreq.payload         AS pmtreq_payload,
                       allocation.contract_id AS allocation_contract_id
                FROM active(?) invoice
                LEFT JOIN active(?) pmtreq ON
                    invoice.payload->>'invoiceNum' = pmtreq.payload->>'invoiceNum'
                    AND invoice.payload->>'buyer' = pmtreq.payload->>'buyer'
                LEFT JOIN active(?) allocation ON
                    pmtreq.payload->>'requestId' = allocation.payload->'allocation'->'settlement'->'settlementRef'->>'id'
                    AND pmtreq.payload->>'buyer' = allocation.payload->'allocation'->'transferLeg'->>'sender'
                WHERE invoice.payload->>'seller' = ? OR invoice.payload->>'buyer' = ? OR invoice.payload->>'provider' = ?
                ORDER BY invoice.contract_id
                """;
        return pqs.query(sql, rs -> {
                    var invoiceId = rs.getString("invoice_contract_id");
                    if (!map.containsKey(invoiceId)) {
                        map.put(invoiceId,
                                new InvoiceWithPaymentRequests(
                                        extract(Invoice.class, cid(Invoice.class, invoiceId), rs.getString("invoice_payload")),
                                        new java.util.ArrayList<>()
                                )
                        );
                    }
                    var pmtreqCid = optionalCid(InvoicePaymentRequest.class, rs.getString("pmtreq_contract_id"));
                    if (pmtreqCid.isPresent()) {
                        map.get(invoiceId).paymentRequests.add(new InvoicePaymentRequestWithAllocationCid(
                                        extract(InvoicePaymentRequest.class, pmtreqCid.get(), rs.getString("pmtreq_payload")),
                                        optionalCid(Allocation.class, rs.getString("allocation_contract_id"))
                                )
                        );
                    }
                },
                qualifiedName(Invoice.class),
                qualifiedName(InvoicePaymentRequest.class),
                qualifiedName(Allocation.class),
                party, party, party
        ).thenApply(v -> new java.util.ArrayList<>(map.values()));
    }

    public CompletableFuture<Optional<Contract<Invoice>>> findInvoiceById(String contractId) {
        return pqs.contractByContractId(Invoice.class, contractId);
    }

    public CompletableFuture<Optional<Contract<InvoicePaymentRequest>>> findActiveInvoicePaymentRequestById(String contractId) {
        return pqs.contractByContractId(InvoicePaymentRequest.class, contractId);
    }

    // ── LogisticsView queries ─────────────────────────────────────────

    public CompletableFuture<List<Contract<LogisticsView>>> findActiveLogisticsViews(String party) {
        return pqs.activeWhere(LogisticsView.class,
                "payload->>'grantor' = ? OR payload->>'carrier' = ? OR payload->>'provider' = ?",
                party, party, party);
    }

    public CompletableFuture<Optional<Contract<LogisticsView>>> findLogisticsViewById(String contractId) {
        return pqs.contractByContractId(LogisticsView.class, contractId);
    }

    // ── BookkeeperView queries ────────────────────────────────────────

    public CompletableFuture<List<Contract<BookkeeperView>>> findActiveBookkeeperViews(String party) {
        return pqs.activeWhere(BookkeeperView.class,
                "payload->>'grantor' = ? OR payload->>'bookkeeper' = ? OR payload->>'provider' = ?",
                party, party, party);
    }

    public CompletableFuture<Optional<Contract<BookkeeperView>>> findBookkeeperViewById(String contractId) {
        return pqs.contractByContractId(BookkeeperView.class, contractId);
    }
}
