package com.bicap.blockchain_adapter_service.repository;

import com.bicap.blockchain_adapter_service.entity.BlockchainRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BlockchainRecordRepository
        extends JpaRepository<BlockchainRecord, Long> {

    Optional<BlockchainRecord> findByBatchId(Long batchId);
}
