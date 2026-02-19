package com.digitalasset.quickstart.service;

import static com.digitalasset.quickstart.service.ServiceUtils.ensurePresent;
import static com.digitalasset.quickstart.service.ServiceUtils.traceServiceCallAsync;
import static com.digitalasset.quickstart.utility.TracingUtils.tracingCtx;
import static com.digitalasset.quickstart.utility.Utils.*;

import com.daml.ledger.api.v2.CommandsOuterClass;
import com.daml.ledger.api.v2.ValueOuterClass;
import com.digitalasset.quickstart.api.InvoicesApi;
import com.digitalasset.quickstart.ledger.LedgerApi;
import com.digitalasset.quickstart.ledger.TokenStandardProxy;
import com.digitalasset.quickstart.repository.DamlRepository;
import com.digitalasset.quickstart.security.AuthUtils;
import com.digitalasset.quickstart.tokenstandard.openapi.allocation.model.DisclosedContract;
import com.digitalasset.transcode.java.ContractId;
import com.digitalasset.transcode.java.Party;
import com.google.protobuf.ByteString;
import io.opentelemetry.instrumentation.annotations.WithSpan;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import org.openapitools.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import quickstart_invoicing.invoicing.invoice.Invoice;
import quickstart_invoicing.invoicing.invoice.Invoice.Invoice_Cancel;
import quickstart_invoicing.invoicing.invoice.Invoice.Invoice_MarkPaid;
import quickstart_invoicing.invoicing.invoice.Invoice.Invoice_RequestPayment;
import quickstart_invoicing.invoicing.invoice.Invoice.Invoice_ShareWithCarrier;
import quickstart_invoicing.invoicing.invoice.Invoice.Invoice_ShareWithBookkeeper;
import quickstart_invoicing.invoicing.invoice.InvoicePaymentRequest;
import quickstart_invoicing.invoicing.invoice.InvoicePaymentRequest.InvoicePaymentRequest_Complete;
import quickstart_invoicing.invoicing.types.InvoiceStatus;
import quickstart_invoicing.invoicing.types.Address;
import quickstart_invoicing.invoicing.types.Contact;
import quickstart_invoicing.invoicing.types.PartyInfo;
import quickstart_invoicing.invoicing.types.LineItem;
import quickstart_invoicing.invoicing.types.TaxEntry;
import splice_api_token_holding_v1.splice.api.token.holdingv1.InstrumentId;
import splice_api_token_metadata_v1.splice.api.token.metadatav1.AnyValue;
import splice_api_token_metadata_v1.splice.api.token.metadatav1.ChoiceContext;
import splice_api_token_metadata_v1.splice.api.token.metadatav1.ExtraArgs;
import splice_api_token_metadata_v1.splice.api.token.metadatav1.Metadata;

@Controller
@RequestMapping("${openapi.asset.base-path:}")
public class InvoiceApiImpl implements InvoicesApi {

    private static final Logger logger = LoggerFactory.getLogger(InvoiceApiImpl.class);

    private final LedgerApi ledger;
    private final DamlRepository damlRepository;
    private final TokenStandardProxy tokenStandardProxy;
    private final AuthUtils auth;

    public InvoiceApiImpl(
            LedgerApi ledger,
            DamlRepository damlRepository,
            TokenStandardProxy tokenStandardProxy,
            AuthUtils authUtils
    ) {
        this.ledger = ledger;
        this.damlRepository = damlRepository;
        this.tokenStandardProxy = tokenStandardProxy;
        this.auth = authUtils;
    }

    @Override
    @WithSpan
    public CompletableFuture<ResponseEntity<List<InvoiceResponse>>> listInvoices() {
        var ctx = tracingCtx(logger, "listInvoices");
        return auth.asAuthenticatedParty(party -> traceServiceCallAsync(ctx, () ->
                damlRepository.findActiveInvoices(party).thenApply(res -> res.stream()
                        .map(InvoiceApiImpl::toInvoiceResponse)
                        .sorted(Comparator.comparingInt(InvoiceResponse::getInvoiceNum))
                        .toList()
                ).thenApply(ResponseEntity::ok)
        ));
    }

    @Override
    @WithSpan
    public CompletableFuture<ResponseEntity<Void>> createInvoice(
            String commandId,
            CreateInvoiceRequest request
    ) {
        var ctx = tracingCtx(logger, "createInvoice", "commandId", commandId);
        return auth.asAdminParty(party -> traceServiceCallAsync(ctx, () ->
                tokenStandardProxy.getRegistryAdminId().thenCompose(adminId -> {
                    var now = Instant.now();

                    // Build nested DAML types from request
                    var sellerAddr = toAddress(request.getSellerInfo().getAddress());
                    var sellerContact = toContact(request.getSellerInfo().getContact());
                    var sellerInfo = new PartyInfo(
                            orEmpty(request.getSellerInfo().getPartyName()),
                            orEmpty(request.getSellerInfo().getRegNumber()),
                            orEmpty(request.getSellerInfo().getTaxNumber()),
                            sellerAddr, sellerContact
                    );

                    var buyerAddr = toAddress(request.getBuyerInfo().getAddress());
                    var buyerContact = toContact(request.getBuyerInfo().getContact());
                    var buyerInfo = new PartyInfo(
                            orEmpty(request.getBuyerInfo().getPartyName()),
                            orEmpty(request.getBuyerInfo().getRegNumber()),
                            orEmpty(request.getBuyerInfo().getTaxNumber()),
                            buyerAddr, buyerContact
                    );

                    var shippingAddress = toAddress(request.getShippingAddress());

                    // Build line items and compute totals
                    var lineItems = request.getLineItems().stream().map(li -> {
                        var qty = li.getQuantity() != null ? li.getQuantity() : BigDecimal.ZERO;
                        var price = li.getUnitPrice() != null ? li.getUnitPrice() : BigDecimal.ZERO;
                        var disc = li.getDiscount() != null ? li.getDiscount() : BigDecimal.ZERO;
                        var taxRate = li.getTaxRate() != null ? li.getTaxRate() : BigDecimal.ZERO;
                        var lineSubtotal = qty.multiply(price).subtract(disc);
                        return new LineItem(
                                orEmpty(li.getItemName()),
                                orEmpty(li.getSku()),
                                qty, orEmpty(li.getUnitOfMeasure()),
                                price, disc, taxRate, lineSubtotal,
                                orEmpty(li.getBatchInfo()),
                                orEmpty(li.getDeliveryDate())
                        );
                    }).toList();

                    var subtotal = lineItems.stream()
                            .map(li -> li.getLineSubtotal)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    var totalDiscount = lineItems.stream()
                            .map(li -> li.getDiscount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    // Build tax breakdown
                    var taxBreakdown = lineItems.stream()
                            .filter(li -> li.getTaxRate.compareTo(BigDecimal.ZERO) > 0)
                            .collect(Collectors.groupingBy(li -> li.getTaxRate))
                            .entrySet().stream()
                            .map(e -> {
                                var taxableAmount = e.getValue().stream()
                                        .map(li -> li.getLineSubtotal)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                                var taxAmount = taxableAmount.multiply(e.getKey());
                                return new TaxEntry("Tax " + e.getKey().multiply(new BigDecimal("100")) + "%", e.getKey(), taxAmount);
                            }).toList();

                    var totalTax = taxBreakdown.stream()
                            .map(te -> te.getTaxAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    var grandTotal = subtotal.add(totalTax);

                    var invoice = new Invoice(
                            new Party(request.getSeller()),   // seller = the seller party
                            new Party(request.getBuyer()),    // buyer
                            new Party(party),                 // provider = admin (app provider)
                            0L,                               // invoiceNum (sequential per provider)
                            now,                              // invoiceDate
                            request.getDueDate().toInstant(),  // dueDate
                            orEmpty(request.getCurrency()),   // currency
                            sellerInfo,
                            buyerInfo,
                            shippingAddress,
                            lineItems,
                            subtotal,
                            totalDiscount,
                            taxBreakdown,
                            totalTax,
                            grandTotal,
                            BigDecimal.ZERO,                  // amountPaid
                            grandTotal,                       // balanceDue = grandTotal initially
                            new InstrumentId(new Party(adminId), "Amulet"),
                            orEmpty(request.getPaymentTerms()),
                            orEmpty(request.getPoNumber()),
                            orEmpty(request.getSalesOrderNumber()),
                            orEmpty(request.getNotes()),
                            orEmpty(request.getDeliveryTerms()),
                            orEmpty(request.getDescription()),
                            InvoiceStatus.Issued,
                            new Metadata(Map.of())
                    );
                    return ledger.create(invoice, commandId)
                            .thenApply(r -> ResponseEntity.status(HttpStatus.CREATED).<Void>build());
                })
        ));
    }

    @Override
    @WithSpan
    public CompletableFuture<ResponseEntity<Void>> requestInvoicePayment(
            String contractId,
            String commandId,
            RequestPaymentRequest request
    ) {
        var ctx = tracingCtx(logger, "requestInvoicePayment",
                "contractId", contractId, "commandId", commandId);
        return auth.asAdminParty(party -> traceServiceCallAsync(ctx, () ->
                damlRepository.findInvoiceById(contractId).thenCompose(optInvoice -> {
                    var invoice = ensurePresent(optInvoice, "Invoice not found for contract %s", contractId);
                    var now = Instant.now();
                    var choice = new Invoice_RequestPayment(
                            UUID.randomUUID().toString(),
                            now,
                            now.plus(Duration.parse(request.getPrepareUntilDuration())),
                            now.plus(Duration.parse(request.getSettleBeforeDuration()))
                    );
                    return ledger.exerciseAndGetResult(invoice.contractId, choice, commandId)
                            .thenApply(r -> ResponseEntity.status(HttpStatus.CREATED).<Void>build());
                })
        ));
    }

    @Override
    @WithSpan
    public CompletableFuture<ResponseEntity<InvoicePaymentResult>> completeInvoicePayment(
            String contractId,
            String commandId,
            CompletePaymentRequest request
    ) {
        var ctx = tracingCtx(logger, "completeInvoicePayment",
                "contractId", contractId, "commandId", commandId);
        return auth.asAdminParty(party -> traceServiceCallAsync(ctx, () -> {
            var choiceContextFut = tokenStandardProxy.getAllocationTransferContext(request.getAllocationContractId());
            var pmtReqFut = damlRepository.findActiveInvoicePaymentRequestById(request.getPaymentRequestContractId());
            return choiceContextFut.thenCombine(pmtReqFut, (c, r) -> {
                var choiceContext = ensurePresent(c, "Transfer context not found for allocation %s", request.getAllocationContractId());
                var pmtReq = ensurePresent(r, "Active payment request not found for contract %s", request.getPaymentRequestContractId());
                var transferContext = prepareTransferContext(choiceContext.getDisclosedContracts());
                var choice = new InvoicePaymentRequest_Complete(
                        new ContractId<>(request.getAllocationContractId()),
                        new ContractId<>(contractId),
                        transferContext.extraArgs
                );
                return ledger.exerciseAndGetResult(pmtReq.contractId, choice, commandId, transferContext.disclosedContracts)
                        .thenApply(result -> {
                            var res = new InvoicePaymentResult();
                            res.setInvoiceId(result.getPaidInvoiceId.getContractId);
                            res.setReceiptId(result.getReceiptId.getContractId);
                            return ResponseEntity.ok(res);
                        });
            }).thenCompose(x -> x);
        }));
    }

    @Override
    @WithSpan
    public CompletableFuture<ResponseEntity<Void>> cancelInvoice(
            String contractId,
            String commandId,
            CancelRequest cancelRequest
    ) {
        var ctx = tracingCtx(logger, "cancelInvoice",
                "contractId", contractId, "commandId", commandId);
        return auth.asAdminParty(party -> traceServiceCallAsync(ctx, () ->
                damlRepository.findInvoiceById(contractId).thenCompose(optInvoice -> {
                    var invoice = ensurePresent(optInvoice, "Invoice not found for contract %s", contractId);
                    var meta = cancelRequest.getMeta() != null ? cancelRequest.getMeta().getData() : Map.<String, String>of();
                    var choice = new Invoice_Cancel(
                            new Party(party),
                            new Metadata(meta)
                    );
                    return ledger.exerciseAndGetResult(invoice.contractId, choice, commandId)
                            .thenApply(r -> ResponseEntity.noContent().<Void>build());
                })
        ));
    }

    @Override
    @WithSpan
    public CompletableFuture<ResponseEntity<Void>> markInvoicePaid(
            String contractId,
            String commandId
    ) {
        var ctx = tracingCtx(logger, "markInvoicePaid",
                "contractId", contractId, "commandId", commandId);
        return auth.asAdminParty(party -> traceServiceCallAsync(ctx, () ->
                damlRepository.findInvoiceById(contractId).thenCompose(optInvoice -> {
                    var invoice = ensurePresent(optInvoice, "Invoice not found for contract %s", contractId);
                    var choice = new Invoice_MarkPaid(Instant.now());
                    return ledger.exerciseAndGetResult(invoice.contractId, choice, commandId)
                            .thenApply(r -> ResponseEntity.noContent().<Void>build());
                })
        ));
    }

    @Override
    @WithSpan
    public CompletableFuture<ResponseEntity<Void>> shareWithCarrier(
            String contractId,
            String commandId,
            ShareWithCarrierRequest request
    ) {
        var ctx = tracingCtx(logger, "shareWithCarrier",
                "contractId", contractId, "commandId", commandId);
        return auth.asAdminParty(party -> traceServiceCallAsync(ctx, () ->
                damlRepository.findInvoiceById(contractId).thenCompose(optInvoice -> {
                    var invoice = ensurePresent(optInvoice, "Invoice not found for contract %s", contractId);
                    var choice = new Invoice_ShareWithCarrier(
                            new Party(request.getCarrier()),
                            new Party(party)
                    );
                    return ledger.exerciseAndGetResult(invoice.contractId, choice, commandId)
                            .thenApply(r -> ResponseEntity.status(HttpStatus.CREATED).<Void>build());
                })
        ));
    }

    @Override
    @WithSpan
    public CompletableFuture<ResponseEntity<Void>> shareWithBookkeeper(
            String contractId,
            String commandId,
            ShareWithBookkeeperRequest request
    ) {
        var ctx = tracingCtx(logger, "shareWithBookkeeper",
                "contractId", contractId, "commandId", commandId);
        return auth.asAdminParty(party -> traceServiceCallAsync(ctx, () ->
                damlRepository.findInvoiceById(contractId).thenCompose(optInvoice -> {
                    var invoice = ensurePresent(optInvoice, "Invoice not found for contract %s", contractId);
                    var choice = new Invoice_ShareWithBookkeeper(
                            new Party(request.getBookkeeper()),
                            new Party(party)
                    );
                    return ledger.exerciseAndGetResult(invoice.contractId, choice, commandId)
                            .thenApply(r -> ResponseEntity.status(HttpStatus.CREATED).<Void>build());
                })
        ));
    }

    // ── Response mappers ──────────────────────────────────────────────

    private static InvoiceResponse toInvoiceResponse(DamlRepository.InvoiceWithPaymentRequests invoiceContract) {
        var ip = invoiceContract.invoice().payload;
        var now = Instant.now();
        var resp = new InvoiceResponse();
        resp.setContractId(invoiceContract.invoice().contractId.getContractId);
        resp.setSeller(ip.getSeller.getParty);
        resp.setBuyer(ip.getBuyer.getParty);
        resp.setProvider(ip.getProvider.getParty);
        resp.setInvoiceNum(ip.getInvoiceNum.intValue());
        resp.setInvoiceDate(toOffsetDateTime(ip.getInvoiceDate));
        resp.setDueDate(toOffsetDateTime(ip.getDueDate));
        resp.setCurrency(ip.getCurrency);
        resp.setDescription(ip.getDescription);

        // Status mapping
        resp.setStatus(switch (ip.getStatus) {
            case InvoiceStatus s when s == InvoiceStatus.Issued -> InvoiceResponse.StatusEnum.ISSUED;
            case InvoiceStatus s when s == InvoiceStatus.PartiallyPaid -> InvoiceResponse.StatusEnum.PARTIALLY_PAID;
            case InvoiceStatus s when s == InvoiceStatus.Paid -> InvoiceResponse.StatusEnum.PAID;
            default -> InvoiceResponse.StatusEnum.VOID;
        });

        // Seller info
        var sellerInfo = new PartyInfoResponse();
        sellerInfo.setPartyName(ip.getSellerInfo.getPartyName);
        sellerInfo.setRegNumber(ip.getSellerInfo.getRegNumber);
        sellerInfo.setTaxNumber(ip.getSellerInfo.getTaxNumber);
        sellerInfo.setAddress(toAddressResponse(ip.getSellerInfo.getAddress));
        sellerInfo.setContact(toContactResponse(ip.getSellerInfo.getContact));
        resp.setSellerInfo(sellerInfo);

        // Buyer info
        var buyerInfo = new PartyInfoResponse();
        buyerInfo.setPartyName(ip.getBuyerInfo.getPartyName);
        buyerInfo.setRegNumber(ip.getBuyerInfo.getRegNumber);
        buyerInfo.setTaxNumber(ip.getBuyerInfo.getTaxNumber);
        buyerInfo.setAddress(toAddressResponse(ip.getBuyerInfo.getAddress));
        buyerInfo.setContact(toContactResponse(ip.getBuyerInfo.getContact));
        resp.setBuyerInfo(buyerInfo);

        // Shipping address
        resp.setShippingAddress(toAddressResponse(ip.getShippingAddress));

        // Line items
        resp.setLineItems(ip.getLineItems.stream().map(li -> {
            var item = new LineItemResponse();
            item.setItemName(li.getItemName);
            item.setSku(li.getSku);
            item.setQuantity(li.getQuantity);
            item.setUnitOfMeasure(li.getUnitOfMeasure);
            item.setUnitPrice(li.getUnitPrice);
            item.setDiscount(li.getDiscount);
            item.setTaxRate(li.getTaxRate);
            item.setLineSubtotal(li.getLineSubtotal);
            item.setBatchInfo(li.getBatchInfo);
            item.setDeliveryDate(li.getDeliveryDate);
            return item;
        }).toList());

        // Tax breakdown
        resp.setTaxBreakdown(ip.getTaxBreakdown.stream().map(te -> {
            var entry = new TaxEntryResponse();
            entry.setTaxName(te.getTaxName);
            entry.setTaxRate(te.getTaxRate);
            entry.setTaxAmount(te.getTaxAmount);
            return entry;
        }).toList());

        // Totals
        resp.setSubtotal(ip.getSubtotal);
        resp.setTotalDiscount(ip.getTotalDiscount);
        resp.setTotalTax(ip.getTotalTax);
        resp.setGrandTotal(ip.getGrandTotal);
        resp.setAmountPaid(ip.getAmountPaid);
        resp.setBalanceDue(ip.getBalanceDue);

        // Optional fields
        resp.setPaymentTerms(ip.getPaymentTerms);
        resp.setPoNumber(ip.getPoNumber);
        resp.setSalesOrderNumber(ip.getSalesOrderNumber);
        resp.setNotes(ip.getNotes);
        resp.setDeliveryTerms(ip.getDeliveryTerms);

        // Payment requests
        var pmtReqs = invoiceContract.paymentRequests().stream()
                .map(pr -> toPaymentRequestResponse(pr, now))
                .sorted(Comparator.comparing(InvoicePaymentRequestResponse::getRequestedAt))
                .toList();
        resp.setPaymentRequests(pmtReqs);
        return resp;
    }

    private static AddressResponse toAddressResponse(Address addr) {
        var resp = new AddressResponse();
        resp.setStreet(addr.getStreet);
        resp.setCity(addr.getCity);
        resp.setState(addr.getState);
        resp.setPostalCode(addr.getPostalCode);
        resp.setCountry(addr.getCountry);
        return resp;
    }

    private static ContactResponse toContactResponse(Contact contact) {
        var resp = new ContactResponse();
        resp.setName(contact.getName);
        resp.setEmail(contact.getEmail);
        resp.setPhone(contact.getPhone);
        return resp;
    }

    private static InvoicePaymentRequestResponse toPaymentRequestResponse(
            DamlRepository.InvoicePaymentRequestWithAllocationCid prContract, Instant now) {
        var rp = prContract.request().payload;
        var resp = new InvoicePaymentRequestResponse();
        resp.setContractId(prContract.request().contractId.getContractId);
        resp.setSeller(rp.getSeller.getParty);
        resp.setBuyer(rp.getBuyer.getParty);
        resp.setProvider(rp.getProvider.getParty);
        resp.setInvoiceNum(rp.getInvoiceNum.intValue());
        resp.setAmount(rp.getAmount);
        resp.setDescription(rp.getDescription);
        resp.setRequestId(rp.getRequestId);
        resp.setPrepareUntil(toOffsetDateTime(rp.getPrepareUntil));
        resp.setSettleBefore(toOffsetDateTime(rp.getSettleBefore));
        resp.setRequestedAt(toOffsetDateTime(rp.getRequestedAt));
        resp.setPrepareDeadlinePassed(!rp.getPrepareUntil.isAfter(now));
        resp.setSettleDeadlinePassed(!rp.getSettleBefore.isAfter(now));
        prContract.allocationCid().ifPresent(cid -> resp.setAllocationCid(cid.getContractId));
        return resp;
    }

    // ── Helpers ────────────────────────────────────────────────────────

    private static String orEmpty(String s) {
        return s != null ? s : "";
    }

    private static Address toAddress(AddressRequest req) {
        if (req == null) return new Address("", "", "", "", "");
        return new Address(
                orEmpty(req.getStreet()),
                orEmpty(req.getCity()),
                orEmpty(req.getState()),
                orEmpty(req.getPostalCode()),
                orEmpty(req.getCountry())
        );
    }

    private static Contact toContact(ContactRequest req) {
        if (req == null) return new Contact("", "", "");
        return new Contact(
                orEmpty(req.getName()),
                orEmpty(req.getEmail()),
                orEmpty(req.getPhone())
        );
    }

    private record TransferContext(ExtraArgs extraArgs, List<CommandsOuterClass.DisclosedContract> disclosedContracts) {}

    private TransferContext prepareTransferContext(List<DisclosedContract> disclosedContracts) {
        var disclosures = disclosedContracts.stream()
                .map(this::toLedgerApiDisclosedContract)
                .toList();
        Map<String, AnyValue> choiceContextMap = disclosures.stream()
                .map(dc -> {
                    var entityName = dc.getTemplateId().getEntityName();
                    if ("AmuletRules".equals(entityName)) return Map.entry("amulet-rules", toAnyValueContractId(dc.getContractId()));
                    if ("OpenMiningRound".equals(entityName)) return Map.entry("open-round", toAnyValueContractId(dc.getContractId()));
                    return null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        return new TransferContext(
                new ExtraArgs(new ChoiceContext(choiceContextMap), new Metadata(Map.of())),
                disclosures
        );
    }

    private CommandsOuterClass.DisclosedContract toLedgerApiDisclosedContract(DisclosedContract dc) {
        ValueOuterClass.Identifier templateId = parseTemplateIdentifier(dc.getTemplateId());
        byte[] blob = Base64.getDecoder().decode(dc.getCreatedEventBlob());
        return CommandsOuterClass.DisclosedContract.newBuilder()
                .setTemplateId(templateId)
                .setContractId(dc.getContractId())
                .setCreatedEventBlob(ByteString.copyFrom(blob))
                .build();
    }

    private static ValueOuterClass.Identifier parseTemplateIdentifier(String templateIdStr) {
        String[] parts = templateIdStr.split(":");
        if (parts.length < 3) throw new IllegalArgumentException("Invalid templateId format: " + templateIdStr);
        String packageId = parts[0];
        String moduleName = parts[1];
        StringBuilder entityNameBuilder = new StringBuilder();
        for (int i = 2; i < parts.length; i++) {
            if (i > 2) entityNameBuilder.append(":");
            entityNameBuilder.append(parts[i]);
        }
        return ValueOuterClass.Identifier.newBuilder()
                .setPackageId(packageId)
                .setModuleName(moduleName)
                .setEntityName(entityNameBuilder.toString())
                .build();
    }

    private static AnyValue toAnyValueContractId(String contractId) {
        return new AnyValue.AnyValue_AV_ContractId(new ContractId<>(contractId));
    }
}
