package com.digitalasset.quickstart.service;

import static com.digitalasset.quickstart.service.ServiceUtils.ensurePresent;
import static com.digitalasset.quickstart.service.ServiceUtils.traceServiceCallAsync;
import static com.digitalasset.quickstart.utility.TracingUtils.tracingCtx;
import static com.digitalasset.quickstart.utility.Utils.*;

import com.digitalasset.quickstart.api.LogisticsViewsApi;
import com.digitalasset.quickstart.api.BookkeeperViewsApi;
import com.digitalasset.quickstart.ledger.LedgerApi;
import com.digitalasset.quickstart.repository.DamlRepository;
import com.digitalasset.quickstart.security.AuthUtils;
import io.opentelemetry.instrumentation.annotations.WithSpan;

import java.util.*;
import java.util.concurrent.CompletableFuture;

import org.openapitools.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import quickstart_invoicing.invoicing.disclosure.LogisticsView;
import quickstart_invoicing.invoicing.disclosure.LogisticsView.LogisticsView_Acknowledge;
import quickstart_invoicing.invoicing.disclosure.LogisticsView.LogisticsView_Revoke;
import quickstart_invoicing.invoicing.disclosure.BookkeeperView;
import quickstart_invoicing.invoicing.disclosure.BookkeeperView.BookkeeperView_Acknowledge;
import quickstart_invoicing.invoicing.disclosure.BookkeeperView.BookkeeperView_Revoke;
import quickstart_invoicing.invoicing.types.InvoiceStatus;
import splice_api_token_metadata_v1.splice.api.token.metadatav1.Metadata;

@Controller
@RequestMapping("${openapi.asset.base-path:}")
public class DisclosureApiImpl implements LogisticsViewsApi, BookkeeperViewsApi {

    private static final Logger logger = LoggerFactory.getLogger(DisclosureApiImpl.class);

    private final LedgerApi ledger;
    private final DamlRepository damlRepository;
    private final AuthUtils auth;

    public DisclosureApiImpl(LedgerApi ledger, DamlRepository damlRepository, AuthUtils authUtils) {
        this.ledger = ledger;
        this.damlRepository = damlRepository;
        this.auth = authUtils;
    }

    // ── Logistics Views ───────────────────────────────────────────────

    @Override
    @WithSpan
    public CompletableFuture<ResponseEntity<List<LogisticsViewResponse>>> listLogisticsViews() {
        var ctx = tracingCtx(logger, "listLogisticsViews");
        return auth.asAuthenticatedParty(party -> traceServiceCallAsync(ctx, () ->
                damlRepository.findActiveLogisticsViews(party).thenApply(res -> res.stream()
                        .map(DisclosureApiImpl::toLogisticsViewResponse)
                        .toList()
                ).thenApply(ResponseEntity::ok)
        ));
    }

    @Override
    @WithSpan
    public CompletableFuture<ResponseEntity<Void>> acknowledgeLogisticsView(
            String contractId,
            String commandId
    ) {
        var ctx = tracingCtx(logger, "acknowledgeLogisticsView",
                "contractId", contractId, "commandId", commandId);
        return auth.asAuthenticatedParty(party -> traceServiceCallAsync(ctx, () ->
                damlRepository.findLogisticsViewById(contractId).thenCompose(optView -> {
                    var view = ensurePresent(optView, "LogisticsView not found for contract %s", contractId);
                    var choice = new LogisticsView_Acknowledge(new Metadata(Map.of()));
                    return ledger.exerciseAndGetResult(view.contractId, choice, commandId, party)
                            .thenApply(r -> ResponseEntity.noContent().<Void>build());
                })
        ));
    }

    @Override
    @WithSpan
    public CompletableFuture<ResponseEntity<Void>> revokeLogisticsView(
            String contractId,
            String commandId
    ) {
        var ctx = tracingCtx(logger, "revokeLogisticsView",
                "contractId", contractId, "commandId", commandId);
        return auth.asAuthenticatedParty(party -> traceServiceCallAsync(ctx, () ->
                damlRepository.findLogisticsViewById(contractId).thenCompose(optView -> {
                    var view = ensurePresent(optView, "LogisticsView not found for contract %s", contractId);
                    var choice = new LogisticsView_Revoke(new Metadata(Map.of()));
                    return ledger.exerciseAndGetResult(view.contractId, choice, commandId, party)
                            .thenApply(r -> ResponseEntity.noContent().<Void>build());
                })
        ));
    }

    // ── Bookkeeper Views ──────────────────────────────────────────────

    @Override
    @WithSpan
    public CompletableFuture<ResponseEntity<List<BookkeeperViewResponse>>> listBookkeeperViews() {
        var ctx = tracingCtx(logger, "listBookkeeperViews");
        return auth.asAuthenticatedParty(party -> traceServiceCallAsync(ctx, () ->
                damlRepository.findActiveBookkeeperViews(party).thenApply(res -> res.stream()
                        .map(DisclosureApiImpl::toBookkeeperViewResponse)
                        .toList()
                ).thenApply(ResponseEntity::ok)
        ));
    }

    @Override
    @WithSpan
    public CompletableFuture<ResponseEntity<Void>> acknowledgeBookkeeperView(
            String contractId,
            String commandId
    ) {
        var ctx = tracingCtx(logger, "acknowledgeBookkeeperView",
                "contractId", contractId, "commandId", commandId);
        return auth.asAuthenticatedParty(party -> traceServiceCallAsync(ctx, () ->
                damlRepository.findBookkeeperViewById(contractId).thenCompose(optView -> {
                    var view = ensurePresent(optView, "BookkeeperView not found for contract %s", contractId);
                    var choice = new BookkeeperView_Acknowledge(new Metadata(Map.of()));
                    return ledger.exerciseAndGetResult(view.contractId, choice, commandId, party)
                            .thenApply(r -> ResponseEntity.noContent().<Void>build());
                })
        ));
    }

    @Override
    @WithSpan
    public CompletableFuture<ResponseEntity<Void>> revokeBookkeeperView(
            String contractId,
            String commandId
    ) {
        var ctx = tracingCtx(logger, "revokeBookkeeperView",
                "contractId", contractId, "commandId", commandId);
        return auth.asAuthenticatedParty(party -> traceServiceCallAsync(ctx, () ->
                damlRepository.findBookkeeperViewById(contractId).thenCompose(optView -> {
                    var view = ensurePresent(optView, "BookkeeperView not found for contract %s", contractId);
                    var choice = new BookkeeperView_Revoke(new Metadata(Map.of()));
                    return ledger.exerciseAndGetResult(view.contractId, choice, commandId, party)
                            .thenApply(r -> ResponseEntity.noContent().<Void>build());
                })
        ));
    }

    // ── Response mappers ──────────────────────────────────────────────

    private static LogisticsViewResponse toLogisticsViewResponse(
            com.digitalasset.quickstart.pqs.Contract<LogisticsView> contract) {
        var p = contract.payload;
        var resp = new LogisticsViewResponse();
        resp.setContractId(contract.contractId.getContractId);
        resp.setGrantor(p.getGrantor.getParty);
        resp.setCarrier(p.getCarrier.getParty);
        resp.setProvider(p.getProvider.getParty);
        resp.setInvoiceRef(p.getInvoiceRef);
        resp.setOrderRef(p.getOrderRef);

        // Ship from address
        var shipFrom = new AddressResponse();
        shipFrom.setStreet(p.getShipFromAddress.getStreet);
        shipFrom.setCity(p.getShipFromAddress.getCity);
        shipFrom.setState(p.getShipFromAddress.getState);
        shipFrom.setPostalCode(p.getShipFromAddress.getPostalCode);
        shipFrom.setCountry(p.getShipFromAddress.getCountry);
        resp.setShipFromAddress(shipFrom);

        // Ship to address
        var shipTo = new AddressResponse();
        shipTo.setStreet(p.getShipToAddress.getStreet);
        shipTo.setCity(p.getShipToAddress.getCity);
        shipTo.setState(p.getShipToAddress.getState);
        shipTo.setPostalCode(p.getShipToAddress.getPostalCode);
        shipTo.setCountry(p.getShipToAddress.getCountry);
        resp.setShipToAddress(shipTo);

        // Contacts
        var sellerContact = new ContactResponse();
        sellerContact.setName(p.getSellerContact.getName);
        sellerContact.setEmail(p.getSellerContact.getEmail);
        sellerContact.setPhone(p.getSellerContact.getPhone);
        resp.setSellerContact(sellerContact);

        var buyerContact = new ContactResponse();
        buyerContact.setName(p.getBuyerContact.getName);
        buyerContact.setEmail(p.getBuyerContact.getEmail);
        buyerContact.setPhone(p.getBuyerContact.getPhone);
        resp.setBuyerContact(buyerContact);

        // Items (NO prices — structurally private)
        resp.setItems(p.getItems.stream().map(item -> {
            var liResp = new LogisticsItemResponse();
            liResp.setItemName(item.getItemName);
            liResp.setSku(item.getSku);
            liResp.setQuantity(item.getQuantity);
            liResp.setUnitOfMeasure(item.getUnitOfMeasure);
            liResp.setBatchInfo(item.getBatchInfo);
            liResp.setDeliveryDate(item.getDeliveryDate);
            return liResp;
        }).toList());

        resp.setDeliveryTerms(p.getDeliveryTerms);
        resp.setNotes(p.getNotes);
        return resp;
    }

    private static BookkeeperViewResponse toBookkeeperViewResponse(
            com.digitalasset.quickstart.pqs.Contract<BookkeeperView> contract) {
        var p = contract.payload;
        var resp = new BookkeeperViewResponse();
        resp.setContractId(contract.contractId.getContractId);
        resp.setGrantor(p.getGrantor.getParty);
        resp.setBookkeeper(p.getBookkeeper.getParty);
        resp.setProvider(p.getProvider.getParty);
        resp.setInvoiceNum(p.getInvoiceNum.intValue());
        resp.setInvoiceDate(toOffsetDateTime(p.getInvoiceDate));
        resp.setSellerName(p.getSellerName);
        resp.setBuyerName(p.getBuyerName);
        resp.setCurrency(p.getCurrency);

        // Status mapping
        resp.setStatus(switch (p.getStatus) {
            case InvoiceStatus s when s == InvoiceStatus.Issued -> BookkeeperViewResponse.StatusEnum.ISSUED;
            case InvoiceStatus s when s == InvoiceStatus.PartiallyPaid -> BookkeeperViewResponse.StatusEnum.PARTIALLY_PAID;
            case InvoiceStatus s when s == InvoiceStatus.Paid -> BookkeeperViewResponse.StatusEnum.PAID;
            default -> BookkeeperViewResponse.StatusEnum.VOID;
        });

        resp.setSubtotal(p.getSubtotal);
        resp.setTotalDiscount(p.getTotalDiscount);

        // Tax breakdown
        resp.setTaxBreakdown(p.getTaxBreakdown.stream().map(te -> {
            var entry = new TaxEntryResponse();
            entry.setTaxName(te.getTaxName);
            entry.setTaxRate(te.getTaxRate);
            entry.setTaxAmount(te.getTaxAmount);
            return entry;
        }).toList());

        resp.setGrandTotal(p.getGrandTotal);
        resp.setAmountPaid(p.getAmountPaid);
        resp.setBalanceDue(p.getBalanceDue);
        resp.setItemCategories(p.getItemCategories);
        return resp;
    }
}
