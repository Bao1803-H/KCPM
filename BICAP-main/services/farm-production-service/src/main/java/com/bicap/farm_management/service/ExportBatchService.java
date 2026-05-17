package com.bicap.farm_management.service;

import com.bicap.farm_management.entity.ExportBatch;
import com.bicap.farm_management.entity.Farm;
import com.bicap.farm_management.entity.ProductionBatch;
import com.bicap.farm_management.repository.ExportBatchRepository;
import com.bicap.farm_management.repository.FarmRepository;
import com.bicap.farm_management.repository.ProductionBatchRepository;
import com.bicap.farm_management.util.QRCodeGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExportBatchService {
    @Autowired
    private ExportBatchRepository exportRepository;
    @Autowired
    private ProductionBatchRepository batchRepository;
    @Autowired
    private BlockchainProducer blockchainProducer;

    @Autowired
    private FarmRepository farmRepository;

    public ExportBatch createExportBatch(Long farmId, Long productionBatchId, ExportBatch exportBatch) {

        Farm farm = farmRepository.findById(farmId)
            .orElseThrow(() -> new RuntimeException("Id farmer không tồn tại."));
        
        ProductionBatch productionBatch = batchRepository.findById(productionBatchId)
            .orElseThrow(() -> new RuntimeException("Lô sản xuất không tồn tại!"));
        
        // 1. Cập nhật trạng thái lô sản xuất thành đã thu hoạch/xuất
        productionBatch.setStatus("EXPORTED");
        batchRepository.save(productionBatch);

        // 2. Thiết lập thông tin xuất kho
        exportBatch.setProductionBatch(productionBatch);
        exportBatch.setFarm(farm);
        exportBatch.setExportDate(LocalDateTime.now());

        // 3. Tạo QR Code (Chứa link truy xuất nguồn gốc)
        // Trong thực tế, link này sẽ trỏ về trang web public cho người dùng quét
        String traceUrl = "https://bicap.vn/trace/" + productionBatch.getBatchCode();
        try {
            // Tạo ảnh QR kích thước 250x250
            byte[] qrImage = QRCodeGenerator.generateQRCodeImage(traceUrl, 250, 250);
            
            // Lưu ảnh dưới dạng chuỗi Base64 để gửi về Frontend hiển thị luôn
            String qrBase64 = Base64.getEncoder().encodeToString(qrImage);
            exportBatch.setQrCodeImage("data:image/png;base64," + qrBase64);
            
        } catch (Exception e) {
            e.printStackTrace();
            exportBatch.setQrCodeImage("ERROR_GENERATING_QR");
        }

        ExportBatch savedExport = exportRepository.save(exportBatch);

        // 4. Gửi thông tin lên Blockchain
        try {
            Map<String, Object> dataToHash = new HashMap<>();
            dataToHash.put("id", savedExport.getId());
            dataToHash.put("type", "EXPORT");
            dataToHash.put("batchCode", savedExport.getBatchCode());
            dataToHash.put("quantity", savedExport.getQuantity());
            dataToHash.put("unit", savedExport.getUnit());
            dataToHash.put("productionBatchId", productionBatch.getId());
            dataToHash.put("exportDate", savedExport.getExportDate().toString());

            blockchainProducer.sendToBlockchain(savedExport.getId(), "EXPORT", dataToHash);
        } catch (Exception e) {
            System.err.println("❌ Lỗi gửi Blockchain (Export): " + e.getMessage());
            e.printStackTrace();
        }

        return savedExport;
    }

    public void updateBlockchainStatus(Long exportId, String txHash) {
        ExportBatch exportBatch = exportRepository.findById(exportId).orElse(null);
        if (exportBatch != null) {
            exportBatch.setTxHash(txHash);
            exportRepository.save(exportBatch);
            System.out.println("✅ Export Batch ID " + exportId + " đã được xác thực trên Blockchain!");
        }
    }

    public List<ExportBatch> getExportBatchesByFarm(Long farmId) {
        return exportRepository.findByFarmIdOrderByExportDateDesc(farmId);
    }
}