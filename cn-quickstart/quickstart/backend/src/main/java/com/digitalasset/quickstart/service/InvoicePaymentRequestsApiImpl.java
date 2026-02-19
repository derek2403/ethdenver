package com.digitalasset.quickstart.service;

import com.digitalasset.quickstart.api.InvoicePaymentRequestsApi;
import com.digitalasset.quickstart.ledger.LedgerApi;
import com.digitalasset.quickstart.repository.DamlRepository;
import com.digitalasset.quickstart.security.AuthUtils;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import splice_api_token_allocation_request_v1.splice.api.token.allocationrequestv1.AllocationRequest;
import splice_api_token_metadata_v1.splice.api.token.metadatav1.ChoiceContext;
import splice_api_token_metadata_v1.splice.api.token.metadatav1.ExtraArgs;
import splice_api_token_metadata_v1.splice.api.token.metadatav1.Metadata;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static com.digitalasset.quickstart.service.ServiceUtils.ensurePresent;
import static com.digitalasset.quickstart.service.ServiceUtils.traceServiceCallAsync;
import static com.digitalasset.quickstart.utility.TracingUtils.tracingCtx;

@Controller
@RequestMapping("${openapi.asset.base-path:}")
public class InvoicePaymentRequestsApiImpl implements InvoicePaymentRequestsApi {

    private static final Logger logger = LoggerFactory.getLogger(InvoicePaymentRequestsApiImpl.class);

    private final LedgerApi ledger;
    private final DamlRepository damlRepository;
    private final AuthUtils auth;

    public InvoicePaymentRequestsApiImpl(LedgerApi ledger, DamlRepository damlRepository, AuthUtils authUtils) {
        this.ledger = ledger;
        this.damlRepository = damlRepository;
        this.auth = authUtils;
    }

    @Override
    @WithSpan
    public CompletableFuture<ResponseEntity<Void>> withdrawInvoicePaymentRequest(String contractId, String commandId) {
        var ctx = tracingCtx(logger, "withdrawInvoicePaymentRequest",
                "contractId", contractId, "commandId", commandId);
        return auth.asAdminParty(party -> traceServiceCallAsync(ctx, () ->
                damlRepository.findActiveAllocationRequestById(contractId).thenCompose(allocReq -> {
                    var allocationRequest = ensurePresent(allocReq, "AllocationRequest %s not found", contractId);
                    var choice = new AllocationRequest.AllocationRequest_Withdraw(
                            new ExtraArgs(new ChoiceContext(Map.of()), new Metadata(Map.of()))
                    );
                    return ledger.exerciseAndGetResult(allocationRequest.contractId, choice, commandId)
                            .thenApply(result -> ResponseEntity.noContent().<Void>build());
                })
        ));
    }
}
