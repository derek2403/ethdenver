package com.digitalasset.quickstart.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class PartyConfigController {

    @Value("${SELLER_PARTY:}")
    private String sellerParty;

    @Value("${BUYER_PARTY:}")
    private String buyerParty;

    @Value("${LOGISTICS_PARTY:}")
    private String logisticsParty;

    @Value("${FINANCE_PARTY:}")
    private String financeParty;

    @GetMapping("/api/parties")
    public ResponseEntity<Map<String, String>> getParties() {
        return ResponseEntity.ok(Map.of(
                "seller", sellerParty,
                "buyer", buyerParty,
                "logistics", logisticsParty,
                "finance", financeParty
        ));
    }
}
