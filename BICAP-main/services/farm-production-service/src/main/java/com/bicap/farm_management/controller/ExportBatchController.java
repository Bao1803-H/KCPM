package com.bicap.farm_management.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bicap.farm_management.entity.ExportBatch;
import com.bicap.farm_management.service.ExportBatchService;

@RestController
@RequestMapping("/api/export-batches")
@CrossOrigin(origins = "*") // Cho phép Frontend (React/Vue/Mobile) gọi API
public class ExportBatchController {

    @Autowired
    private ExportBatchService exportBatchService;

    // 1. API Xuất hàng (Kết thúc mùa vụ + Tạo QR Code + Gửi Blockchain)
    // Gọi: POST /api/export-batches/batch/{batchId}
    // Body: { "quantity": 1000, "unit": "kg", "notes": "Xuất bán cho siêu thị" }
    // Use hasAuthority instead of hasRole to match SecurityConfig
    @PreAuthorize("hasAuthority('ROLE_FARMMANAGER')")
    @PostMapping("/farm/{farmId}/batch/{batchId}")
    public ResponseEntity<ExportBatch> createExportBatch(
            @PathVariable Long farmId,
            @PathVariable Long batchId,
            @RequestBody ExportBatch exportBatch) {
        
        // Gọi Service để xử lý logic nghiệp vụ
        ExportBatch savedExport = exportBatchService.createExportBatch(farmId, batchId, exportBatch);
        
        // Trả về đối tượng đã lưu (bao gồm cả chuỗi Base64 của ảnh QR Code)
        return ResponseEntity.ok(savedExport);
    }

    @PreAuthorize("hasAuthority('ROLE_FARMMANAGER')")
    @GetMapping("/farm/{farmId}")
    public ResponseEntity<List<ExportBatch>> getExportBatchesByFarm(@PathVariable Long farmId) {
        return ResponseEntity.ok(exportBatchService.getExportBatchesByFarm(farmId));
    }
}
