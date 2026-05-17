package com.example.admin_service.controller;

import com.example.admin_service.client.BlockchainServiceClient;
import com.example.admin_service.dto.BlockchainRecordResponse;
import com.example.admin_service.dto.BlockchainStatsResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/blockchain")
@Tag(name = "Admin Blockchain Management", description = "APIs quản lý smart contracts và blockchain records dành cho Admin")
public class AdminBlockchainController {

    @Autowired
    private BlockchainServiceClient blockchainServiceClient;

    /**
     * GET /api/v1/admin/blockchain/records - Lấy tất cả blockchain records
     */
    @GetMapping("/records")
    @Operation(summary = "Lấy tất cả blockchain records", 
               description = "Admin xem tất cả các records đã được ghi lên blockchain")
    public ResponseEntity<List<BlockchainRecordResponse>> getAllRecords() {
        List<BlockchainRecordResponse> records = blockchainServiceClient.getAllRecords();
        return ResponseEntity.ok(records);
    }

    /**
     * GET /api/v1/admin/blockchain/records/{id} - Lấy chi tiết blockchain record
     */
    @GetMapping("/records/{id}")
    @Operation(summary = "Lấy chi tiết blockchain record", 
               description = "Xem chi tiết một blockchain record theo ID")
    public ResponseEntity<BlockchainRecordResponse> getRecordById(@PathVariable Long id) {
        BlockchainRecordResponse record = blockchainServiceClient.getRecordById(id);
        return ResponseEntity.ok(record);
    }

    /**
     * GET /api/v1/admin/blockchain/records/batch/{batchId} - Lấy blockchain record theo batchId
     */
    @GetMapping("/records/batch/{batchId}")
    @Operation(summary = "Lấy blockchain record theo batch", 
               description = "Xem blockchain record của một production batch cụ thể")
    public ResponseEntity<BlockchainRecordResponse> getRecordByBatchId(@PathVariable Long batchId) {
        BlockchainRecordResponse record = blockchainServiceClient.getRecordByBatchId(batchId);
        return ResponseEntity.ok(record);
    }

    /**
     * GET /api/v1/admin/blockchain/stats - Thống kê blockchain
     */
    @GetMapping("/stats")
    @Operation(summary = "Thống kê blockchain", 
               description = "Lấy thống kê về số lượng records trên blockchain")
    public ResponseEntity<BlockchainStatsResponse> getStats() {
        BlockchainStatsResponse stats = blockchainServiceClient.getStats();
        return ResponseEntity.ok(stats);
    }
}
