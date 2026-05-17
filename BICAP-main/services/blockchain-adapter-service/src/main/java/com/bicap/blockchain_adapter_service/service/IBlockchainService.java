package com.bicap.blockchain_adapter_service.service;

import com.bicap.blockchain_adapter_service.dto.VerifyBlockchainResponse;

public interface IBlockchainService {

    void write(Long batchId, String resourceType, String rawData);

    VerifyBlockchainResponse verify(Long batchId);
}
