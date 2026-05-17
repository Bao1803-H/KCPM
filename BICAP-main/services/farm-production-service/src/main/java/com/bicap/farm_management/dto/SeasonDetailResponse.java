package com.bicap.farm_management.dto;

import java.util.List;

import com.bicap.farm_management.entity.ExportBatch;
import com.bicap.farm_management.entity.FarmingProcess;
import com.bicap.farm_management.entity.ProductionBatch;

import lombok.Data;

@Data
public class SeasonDetailResponse {
    // Thông tin cơ bản mùa vụ
    private ProductionBatch productionBatch;
    
    // Tiến trình canh tác (Nhật ký)
    private List<FarmingProcess> farmingProcesses;
    
    // Lịch sử xuất hàng và QR Code
    private List<ExportBatch> exportBatches;

    public SeasonDetailResponse(ProductionBatch batch, List<FarmingProcess> processes, List<ExportBatch> exports) {
        this.productionBatch = batch;
        this.farmingProcesses = processes;
        this.exportBatches = exports;
    }
}