package com.bicap.farm_management.service;

import com.bicap.farm_management.entity.FarmingProcess;
import com.bicap.farm_management.entity.ProductionBatch;
import com.bicap.farm_management.repository.FarmingProcessRepository;
import com.bicap.farm_management.repository.ProductionBatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FarmingProcessService {
    @Autowired
    private FarmingProcessRepository processRepository;
    @Autowired
    private ProductionBatchRepository batchRepository;
    @Autowired
    private BlockchainProducer blockchainProducer; // Tận dụng lại cái "Súng" có sẵn

    public FarmingProcess addProcess(Long batchId, FarmingProcess process, Long userId) {
        // 1. Tìm lô sản xuất
        ProductionBatch batch = batchRepository.findById(batchId)
            .orElseThrow(() -> new RuntimeException("Lô sản xuất không tồn tại!"));

        // 2. Check ownership
        if (!batch.getFarm().getOwnerId().equals(userId)) {
            throw new RuntimeException("Access Denied: You do not own this farm.");
        }

        process.setProductionBatch(batch);
        process.setStatus("PENDING_BLOCKCHAIN");

        // 2. Lưu DB
        FarmingProcess savedProcess = processRepository.save(process);

        // 3. Bắn lên Blockchain (Dùng Map để tránh lỗi Gson)
        try {
            Map<String, Object> dataToHash = new HashMap<>();
            dataToHash.put("id", savedProcess.getId());
            dataToHash.put("type", "PROCESS"); // Đánh dấu đây là Nhật ký
            dataToHash.put("processType", savedProcess.getProcessType());
            dataToHash.put("description", savedProcess.getDescription());
            dataToHash.put("batchId", batch.getId());
            
            if (savedProcess.getPerformedDate() != null) {
                dataToHash.put("date", savedProcess.getPerformedDate().toString());
            }

            // Gửi đi
            blockchainProducer.sendToBlockchain(savedProcess.getId(), "PROCESS", dataToHash);
            
        } catch (Exception e) {
            System.err.println("❌ Lỗi gửi Blockchain: " + e.getMessage());
        }

        return savedProcess;
    }

    public List<FarmingProcess> getProcessesByBatch(Long batchId) {
        return processRepository.findByProductionBatchId(batchId);
    }
    
    // Hàm cập nhật trạng thái khi Blockchain phản hồi (Sẽ dùng ở Bước 4)
    public void updateBlockchainStatus(Long processId, String txHash) {
        FarmingProcess process = processRepository.findById(processId).orElse(null);
        if (process != null) {
            process.setStatus("SYNCED");
            process.setTxHash(txHash);
            processRepository.save(process);
            System.out.println("✅ Nhật ký ID " + processId + " đã được xác thực trên Blockchain!");
        }
    }
}