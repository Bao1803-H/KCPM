package com.example.admin_service.client;

import com.example.admin_service.dto.BlockchainRecordResponse;
import com.example.admin_service.dto.BlockchainStatsResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "blockchain-adapter-service", url = "${blockchain.service.url:http://localhost:8084}")
public interface BlockchainServiceClient {

    @GetMapping("/api/blockchain/records")
    List<BlockchainRecordResponse> getAllRecords();

    @GetMapping("/api/blockchain/records/{id}")
    BlockchainRecordResponse getRecordById(@PathVariable("id") Long id);

    @GetMapping("/api/blockchain/records/batch/{batchId}")
    BlockchainRecordResponse getRecordByBatchId(@PathVariable("batchId") Long batchId);

    @GetMapping("/api/blockchain/stats")
    BlockchainStatsResponse getStats();
}
