package com.example.admin_service.controller;

import com.example.admin_service.dto.RoleRequestDTO;
import com.example.admin_service.dto.RoleRequestResponseDTO;
import com.example.admin_service.entity.RoleRequest;
import com.example.admin_service.service.RoleApprovalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/role-requests")
public class RoleRequestController {

    @Autowired
    private RoleApprovalService approvalService;

    // --- Dành cho USER ---

    // API: User nộp đơn (Được gọi từ nút "Update Profile" bên React/EJS)
    @PostMapping("/submit")
    public ResponseEntity<?> submitRequest(@RequestBody RoleRequestDTO dto,
                                           @RequestHeader("X-User-Id") Long userId) {
        // Lưu ý: Lấy userId từ Token hoặc Header do Gateway truyền xuống
        return ResponseEntity.ok(approvalService.submitRequest(userId, dto.getRequestedRole(), dto.getDocumentUrls()));
    }

    // --- Dành cho ADMIN ---

    // API: Admin xem danh sách chờ
    @GetMapping("/pending")
    public ResponseEntity<List<RoleRequestResponseDTO>> getPendingRequests() {
        return ResponseEntity.ok(approvalService.getPendingRequests());
    }

    // API: Admin Duyệt
    @PostMapping("/{requestId}/approve")
    public ResponseEntity<?> approveRequest(@PathVariable Long requestId) {
        try {
            approvalService.approveRequest(requestId);
            return ResponseEntity.ok("Request Approved! User role has been updated.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());  // Trả 400 với message error
        }
    }

    // API: Admin Từ chối
    @PostMapping("/{requestId}/reject")
    public ResponseEntity<?> rejectRequest(@PathVariable Long requestId, @RequestBody String reason) {
        approvalService.rejectRequest(requestId, reason);
        return ResponseEntity.ok("Request Rejected.");
    }
}