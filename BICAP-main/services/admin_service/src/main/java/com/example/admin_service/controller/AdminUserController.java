package com.example.admin_service.controller;

import com.example.admin_service.dto.UserResponseDTO;
import com.example.admin_service.enums.UserStatus;
import com.example.admin_service.service.AdminUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

    @Autowired
    private AdminUserService adminUserService;

    @GetMapping("/all")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        return ResponseEntity.ok(adminUserService.getAllUsers());
    }

    // API: PUT /api/v1/admin/users/5/status?status=BLOCKED
    @PutMapping("/{id}/status")
    public ResponseEntity<String> changeStatus(@PathVariable Long id, @RequestParam UserStatus status) {
        adminUserService.changeUserStatus(id, status);
        return ResponseEntity.ok("User status updated to " + status);
    }
    //API: gọi phân trang user
    @GetMapping
    public ResponseEntity<java.util.Map<String, Object>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(name = "limit", defaultValue = "10") int limit
    ) {
        org.springframework.data.domain.Page<UserResponseDTO> userPage = 
            adminUserService.getUsersWithFilter(keyword, role, page, limit);
            
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("content", userPage.getContent());
        
        java.util.Map<String, Object> meta = new java.util.HashMap<>();
        meta.put("total", userPage.getTotalElements());
        meta.put("page", page);
        meta.put("limit", limit);
        
        response.put("meta", meta);
        return ResponseEntity.ok(response);
    }
}