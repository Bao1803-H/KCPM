package com.bicap.shipping_manager_service.client;

import com.bicap.shipping_manager_service.dto.WriteBlockchainRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "blockchain-adapter-service", url = "${application.config.blockchain-service-url}")
public interface BlockchainServiceClient {
    @PostMapping("/api/blockchain/write")
    ResponseEntity<String> writeToBlockchain(@RequestBody WriteBlockchainRequest request);
}