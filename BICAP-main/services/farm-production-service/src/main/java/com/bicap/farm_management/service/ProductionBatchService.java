package com.bicap.farm_management.service;

import com.bicap.farm_management.entity.Farm;
import com.bicap.farm_management.entity.ProductionBatch;
import com.bicap.farm_management.repository.FarmRepository;
import com.bicap.farm_management.repository.ProductionBatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ProductionBatchService {

    @Autowired
    private ProductionBatchRepository batchRepository;

    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private BlockchainProducer blockchainProducer;

    public ProductionBatch createBatch(Long farmId, ProductionBatch batch) {
        // 1. Kiểm tra Farm có tồn tại không
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new RuntimeException("Farm not found with ID: " + farmId));
        
        batch.setFarm(farm);
        batch.setStatus("PENDING_BLOCKCHAIN"); // Đặt trạng thái chờ
        
        // 2. Lưu vào DB trước để lấy ID
        ProductionBatch savedBatch = batchRepository.save(batch);

        // 3. Bắn tin nhắn sang Blockchain Adapter
        try {
            // === PHẦN SỬA LỖI QUAN TRỌNG ===
            // Không gửi cả object 'savedBatch' vì nó chứa Hibernate Proxy gây lỗi.
            // Thay vào đó, tạo một Map thủ công chỉ chứa dữ liệu cần thiết.
            Map<String, Object> dataToHash = new HashMap<>();
            dataToHash.put("id", savedBatch.getId());
            dataToHash.put("batchCode", savedBatch.getBatchCode());
            dataToHash.put("productType", savedBatch.getProductType());
            dataToHash.put("status", savedBatch.getStatus());
            dataToHash.put("farmId", farm.getId()); // Chỉ lấy ID, không lấy cả object Farm
            
            // Xử lý ngày tháng: Chuyển về String để tránh lỗi định dạng
            if (savedBatch.getStartDate() != null) {
                dataToHash.put("startDate", savedBatch.getStartDate().toString());
            }
            if (savedBatch.getEndDate() != null) {
                dataToHash.put("endDate", savedBatch.getEndDate().toString());
            }

            // Gửi Map này đi để tính Hash (Gson xử lý Map rất tốt)
            blockchainProducer.sendToBlockchain(savedBatch.getId(), "BATCH", dataToHash);
            
        } catch (Exception e) {
            System.err.println("❌ Lỗi gửi RabbitMQ: " + e.getMessage());
            e.printStackTrace();
            // Không ném lỗi ra ngoài để tránh rollback transaction (Dữ liệu vẫn được lưu vào DB)
        }

        return savedBatch;
    }

    public List<ProductionBatch> getBatchesByFarm(Long farmId) {
        return batchRepository.findByFarmId(farmId);
    }
    
    // Hàm cập nhật kết quả từ Blockchain
    public void updateBlockchainStatus(Long batchId, String txHash) {
        ProductionBatch batch = batchRepository.findById(batchId).orElse(null);
        if (batch != null) {
            batch.setStatus("SYNCED");
            batch.setTxHash(txHash);
            batchRepository.save(batch);
            System.out.println("✅ Đã cập nhật trạng thái SYNCED cho Batch ID: " + batchId);
        } else {
            System.err.println("⚠️ Không tìm thấy Batch ID: " + batchId + " để cập nhật.");
        }
    }

    @Autowired
    private com.bicap.farm_management.repository.FarmingProcessRepository processRepository;
    
    @Autowired
    private com.bicap.farm_management.repository.ExportBatchRepository exportBatchRepository;

    // CHỨC NĂNG MỚI: Lấy chi tiết toàn bộ mùa vụ (Monitor)
    public com.bicap.farm_management.dto.SeasonDetailResponse getSeasonDetail(Long batchId) {
        // 1. Lấy thông tin mùa vụ
        ProductionBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mùa vụ với ID: " + batchId));

        // 2. Lấy danh sách nhật ký canh tác (Tiến trình)
        List<com.bicap.farm_management.entity.FarmingProcess> processes = processRepository.findByProductionBatchId(batchId);

        // 3. Lấy danh sách đợt xuất hàng (đã có QR)
        List<com.bicap.farm_management.entity.ExportBatch> exports = exportBatchRepository.findByProductionBatchId(batchId);

        return new com.bicap.farm_management.dto.SeasonDetailResponse(batch, processes, exports);
    }
}