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
    public ResponseEntity<Page<UserResponseDTO>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(adminUserService.getUsersWithFilter(keyword, role, page, size));
    }
}