package com.bicap.farm_management.service;

import com.bicap.farm_management.dto.FarmLogDTO;
import com.bicap.farm_management.entity.ExportBatch;
import com.bicap.farm_management.entity.ProductionBatch;
import com.bicap.farm_management.repository.ExportBatchRepository;
import com.bicap.farm_management.repository.ProductionBatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class FarmLogService {

    @Autowired
    private ProductionBatchRepository productionRepository;

    @Autowired
    private ExportBatchRepository exportRepository;

    public List<FarmLogDTO> getIntegratedLogs(Long farmId) {
        System.out.println("DEBUG: Bắt đầu tìm log cho Farm ID: " + farmId);
        List<FarmLogDTO> logs = new ArrayList<>();

        // 1. Lấy dữ liệu SẢN XUẤT và chuyển đổi
        List<ProductionBatch> productions = productionRepository.findByFarmId(farmId);
        System.out.println("DEBUG: Tìm thấy " + productions.size() + " mùa vụ."); // LOG QUAN TRỌNG
        for (ProductionBatch pb : productions) {
            FarmLogDTO log = new FarmLogDTO();
            log.setId(pb.getId());
            log.setType("SẢN XUẤT");
            log.setCode(pb.getBatchCode());
            log.setDescription("Tạo mùa vụ mới cho sản phẩm: " + pb.getProductType());
            log.setStatus(pb.getStatus()); // Ví dụ: ACTIVE
            if (pb.getStartDate() != null) {
                log.setTimestamp(pb.getStartDate().atStartOfDay());
            } else {
                // Phòng hờ nếu startDate cũng null thì lấy giờ hiện tại để không bị lỗi
                log.setTimestamp(LocalDateTime.now());
            }
            logs.add(log);
        }

        // 2. Lấy dữ liệu XUẤT KHẨU và chuyển đổi
        List<ExportBatch> exports = exportRepository.findByFarmIdOrderByExportDateDesc(farmId);
        System.out.println("DEBUG: Tìm thấy " + exports.size() + " đơn xuất khẩu."); // LOG QUAN TRỌNG
        for (ExportBatch eb : exports) {
            FarmLogDTO log = new FarmLogDTO();
            log.setId(eb.getId());
            log.setType("XUẤT KHẨU");
            log.setCode(eb.getBatchCode());
            // Lấy thông tin từ bảng cha để mô tả rõ hơn
            String prodName = eb.getProductionBatch().getProductType();
            log.setDescription("Xuất khẩu " + eb.getQuantity() + " " + eb.getUnit() + " " + prodName);
            log.setStatus("COMPLETED"); // Export thường là đã xong
            log.setTimestamp(eb.getCreatedAt()); // Lấy thời gian tạo phiếu xuất
            logs.add(log);
        }

        // 3. Sắp xếp danh sách: Mới nhất lên đầu (Giảm dần theo timestamp)
        logs.sort(Comparator.comparing(FarmLogDTO::getTimestamp).reversed());

        return logs;
    }
}