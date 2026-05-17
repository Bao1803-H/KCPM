package com.bicap.blockchain_adapter_service.dto;

public record VerifyBlockchainResponse(
        Long batchId,
        boolean valid,
        String message
) {}
