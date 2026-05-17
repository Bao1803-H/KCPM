package com.bicap.blockchain_adapter_service.service;

import com.bicap.blockchain_adapter_service.dto.VerifyBlockchainResponse;
import com.bicap.blockchain_adapter_service.entity.BlockchainRecord;
import com.bicap.blockchain_adapter_service.entity.TraceLog;
import com.bicap.blockchain_adapter_service.repository.BlockchainRecordRepository;
import com.bicap.blockchain_adapter_service.repository.TraceLogRepository;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.security.MessageDigest;

@Service
public class BlockchainService implements IBlockchainService {

    private final BlockchainRecordRepository recordRepository;
    private final TraceLogRepository traceLogRepository;
    private final BlockchainClient blockchainClient;

    public BlockchainService(BlockchainRecordRepository recordRepository,
                             TraceLogRepository traceLogRepository,
                             BlockchainClient blockchainClient) {
        this.recordRepository = recordRepository;
        this.traceLogRepository = traceLogRepository;
        this.blockchainClient = blockchainClient;
    }

    @Override
    public void write(Long batchId, String resourceType, String rawData) {

        // ✅ Validate dữ liệu đầu vào (BẮT BUỘC)
        if (batchId == null) {
            throw new IllegalArgumentException("batchId must not be null");
        }

        if (resourceType == null || resourceType.isBlank()) {
            throw new IllegalArgumentException("resourceType must not be empty");
        }

        if (rawData == null || rawData.isBlank()) {
            throw new IllegalArgumentException("rawData must not be empty");
        }

        // 1. Ghi hash lên blockchain (MOCK)
        String dataHash = calculateHash(rawData);
        String txHash = blockchainClient.writeHash(dataHash);

        // 2. Lưu off-chain DB
        BlockchainRecord record = new BlockchainRecord();
        record.setBatchId(batchId);
        record.setDataHash(dataHash);
        record.setBlockchainTx(txHash);
        record.setNetwork("VeChainThor");
        record.setCreatedAt(LocalDateTime.now());

        recordRepository.save(record);

        // 4. Ghi log truy vết
        TraceLog log = new TraceLog();
        log.setObjectType(resourceType);
        log.setObjectId(batchId);
        log.setAction("WRITE_BLOCKCHAIN");
        log.setCreatedAt(LocalDateTime.now());

        traceLogRepository.save(log);
    }

    @Override
    public VerifyBlockchainResponse verify(Long batchId) {

        if (batchId == null) {
            throw new IllegalArgumentException("batchId must not be null");
        }

        BlockchainRecord record = recordRepository
                .findByBatchId(batchId)
                .orElseThrow(() ->
                        new RuntimeException("Batch not found: " + batchId)
                );

        boolean valid = blockchainClient.verifyHash(record.getDataHash());

        TraceLog log = new TraceLog();
        log.setObjectType("BATCH");
        log.setObjectId(batchId);
        log.setAction("VERIFY_BLOCKCHAIN");
        log.setCreatedAt(LocalDateTime.now());

        traceLogRepository.save(log);

        return new VerifyBlockchainResponse(
                batchId,
                valid,
                valid ? "Data is valid" : "Data has been modified"
        );
    }

    private String calculateHash(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error calculating hash", e);
        }
    }
}
