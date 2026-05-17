package com.bicap.farm_management.controller;

import com.bicap.farm_management.dto.FarmUpdateDto;
import com.bicap.farm_management.entity.*;
import com.bicap.farm_management.repository.FarmRepository;
import com.bicap.farm_management.service.FarmFeatureService;
import com.bicap.farm_management.dto.FarmLogDTO;
import com.bicap.farm_management.service.FarmLogService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.bicap.farm_management.dto.FarmCreateDto; // Import DTO mới

@RestController
@RequestMapping("/api/farm-features")
public class FarmFeatureController {

    @Autowired
    private FarmFeatureService farmFeatureService;
    @Autowired
    private FarmRepository farmRepository;
    @Autowired
    private FarmLogService farmLogService;

    @PostMapping("/")
    public ResponseEntity<?> createFarm(@RequestBody FarmCreateDto dto, HttpServletRequest request) {
        // Lấy userId từ request attribute (đã được JwtAuthenticationFilter set vào)
        Long userId = (Long) request.getAttribute("userId");

        // Kiểm tra xem có lấy được không (đề phòng token lỗi hoặc auth service chưa gửi ID)
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Không tìm thấy User ID. Vui lòng đăng nhập lại.");
        }

        // Tạo farm với ownerId từ JWT token
        Farm createdFarm = farmFeatureService.createFarm(dto, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdFarm);
    }
    
    // API tạo farm mới cho owner (được gọi khi admin duyệt role FARM_MANAGER)
    @PostMapping("/create-for-owner")
    public ResponseEntity<Farm> createFarmForOwner(@RequestBody Map<String, Long> request) {
        Long ownerId = request.get("ownerId");
        if (ownerId == null) {
            return ResponseEntity.badRequest().build();
        }
        Farm createdFarm = farmFeatureService.createFarmForOwner(ownerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdFarm);
    }
    // 1. Cập nhật thông tin trang trại
    @PutMapping("/{farmId}/info")
    public ResponseEntity<Farm> updateInfo(@PathVariable Long farmId, @RequestBody FarmUpdateDto dto) {
        return ResponseEntity.ok(farmFeatureService.updateFarmInfo(farmId, dto));
    }
    // 2. Lấy thông tin chi tiết trang trại
    @GetMapping("/{farmId}")
    public ResponseEntity<Farm> getFarmDetail(@PathVariable Long farmId) {
        return ResponseEntity.ok(farmFeatureService.getFarmById(farmId));
    }
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<Farm> getFarmByOwnerId(@PathVariable Long ownerId) {
        return ResponseEntity.ok(farmFeatureService.getFarmByOwnerId(ownerId));
    }
    @GetMapping // Map vào GET /api/farm-features
    public ResponseEntity<List<Farm>> getAllFarms() {
        // Lưu ý: Bạn cần chắc chắn trong FarmFeatureService đã viết hàm getAllFarms()
        return ResponseEntity.ok(farmFeatureService.getAllFarms());
    }
    //API: đếm tổng số nông trại
    @GetMapping("/count")
    public ResponseEntity<Long> countFarms() {
        return ResponseEntity.ok(farmRepository.count());
    }
    // API MỚI: Lấy nhật ký tổng hợp
    @GetMapping("/{farmId}/logs")
    public ResponseEntity<List<FarmLogDTO>> getFarmLogs(@PathVariable Long farmId) {
        return ResponseEntity.ok(farmLogService.getIntegratedLogs(farmId));
    }
}