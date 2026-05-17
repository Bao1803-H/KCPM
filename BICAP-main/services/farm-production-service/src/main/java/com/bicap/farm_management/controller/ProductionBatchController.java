package com.bicap.farm_management.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bicap.farm_management.entity.ProductionBatch;
import com.bicap.farm_management.service.ProductionBatchService;

@RestController
@RequestMapping("/api/production-batches")
@CrossOrigin(origins = "*") // Cho phép gọi từ mọi nơi (Frontend/Postman)
public class ProductionBatchController {

    @Autowired
    private ProductionBatchService batchService;

    // 1. API Tạo Lô sản xuất (Sẽ tự động bắn tin nhắn sang Blockchain)
    // Gọi: POST /api/production-batches/farm/{farmId}
    // Use hasAuthority instead of hasRole to match SecurityConfig
    @PreAuthorize("hasAuthority('ROLE_FARMMANAGER')")
    @PostMapping("/farm/{farmId}")
    public ProductionBatch createBatch(@PathVariable Long farmId, @RequestBody ProductionBatch batch) {
        return batchService.createBatch(farmId, batch);
    }

    // 2. API Xem danh sách Lô sản xuất của một Trang trại
    // Gọi: GET /api/production-batches/farm/{farmId}
    // Use hasAnyAuthority instead of hasRole to match SecurityConfig
    @PreAuthorize("hasAnyAuthority('ROLE_FARMMANAGER', 'ROLE_ADMIN')")
    @GetMapping("/farm/{farmId}")
    public List<ProductionBatch> getBatchesByFarm(@PathVariable Long farmId) {
        return batchService.getBatchesByFarm(farmId);
    }

    // 3. API Xem chi tiết mùa vụ (Monitor: Info + Process + Export + QR)
    // Gọi: GET /api/production-batches/{id}/detail
    // Use hasAnyAuthority instead of hasRole to match SecurityConfig
    @PreAuthorize("hasAnyAuthority('ROLE_FARMMANAGER', 'ROLE_ADMIN')") // Hoặc có thể cho cả RETAILER xem
    @GetMapping("/{id}/detail")
    public com.bicap.farm_management.dto.SeasonDetailResponse getSeasonDetail(@PathVariable Long id) {
        return batchService.getSeasonDetail(id);
    }
}