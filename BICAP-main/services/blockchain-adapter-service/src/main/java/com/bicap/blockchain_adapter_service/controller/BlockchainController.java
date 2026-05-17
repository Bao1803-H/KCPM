package com.bicap.blockchain_adapter_service.controller;

import com.bicap.blockchain_adapter_service.dto.VerifyBlockchainResponse;
import com.bicap.blockchain_adapter_service.dto.WriteBlockchainRequest;
import com.bicap.blockchain_adapter_service.service.IBlockchainService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/blockchain")
public class BlockchainController {

    private final IBlockchainService blockchainService;

    public BlockchainController(IBlockchainService blockchainService) {
        this.blockchainService = blockchainService;
    }

    @PostMapping("/write")
    public ResponseEntity<String> writeToBlockchain(
            @RequestBody WriteBlockchainRequest request) {

        // ✅ Validate request ngay tại controller
        if (request == null
                || request.getBatchId() == null
                || request.getRawData() == null
                || request.getRawData().isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body("batchId and rawData are required");
        }

        blockchainService.write(
                request.getBatchId(),
                "BATCH",
                request.getRawData()
        );

        return ResponseEntity.ok("Written to blockchain");
    }

    @GetMapping("/verify/{batchId}")
    public ResponseEntity<VerifyBlockchainResponse> verify(
            @PathVariable Long batchId) {

        if (batchId == null) {
            return ResponseEntity.badRequest().build();
        }

        VerifyBlockchainResponse response =
                blockchainService.verify(batchId);

        return ResponseEntity.ok(response);
    }
}
