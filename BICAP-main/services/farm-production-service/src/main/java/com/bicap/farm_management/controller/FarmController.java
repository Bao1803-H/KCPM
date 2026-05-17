package com.bicap.farm_management.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.bicap.farm_management.entity.Farm;
import com.bicap.farm_management.service.FarmService;

import java.util.List;

@RestController
@RequestMapping("/api/farms")
@CrossOrigin(origins = "*")
public class FarmController {
    @Autowired
    private FarmService farmService;

    @PostMapping
    // Thêm tham số HttpServletRequest request
    public ResponseEntity<?> createFarm(@RequestBody Farm farm, HttpServletRequest request) {
        // 1. Lấy userId từ request attribute (đã được Filter set vào)
        Long userId = (Long) request.getAttribute("userId");

        // Kiểm tra xem có lấy được không (đề phòng token lỗi hoặc auth service chưa gửi ID)
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Không tìm thấy User ID. Vui lòng đăng nhập lại.");
        }

        // 2. Gán userId vào làm ownerId của Farm
        farm.setOwnerId(userId);

        // 3. Tạo farm
        Farm createdFarm = farmService.createFarm(farm);
        return ResponseEntity.ok(createdFarm);
    }

    @GetMapping
    public List<Farm> getAllFarms() {
        return farmService.getAllFarms();
    }
}