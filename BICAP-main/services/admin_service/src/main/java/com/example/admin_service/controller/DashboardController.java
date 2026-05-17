package com.example.admin_service.controller;

import com.example.admin_service.client.FarmServiceClient;
import com.example.admin_service.client.TradingOrderServiceClient;
import com.example.admin_service.dto.OrderStatisticsDTO;
import com.example.admin_service.enums.ERole;
import com.example.admin_service.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.criteria.Join;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@Tag(name = "Admin Dashboard", description = "APIs thống kê tổng quan cho Admin Dashboard")
public class DashboardController {

    @Autowired
    private UserRepository userRepository; // Lấy số User
    
    @Autowired
    private FarmServiceClient farmServiceClient; // Lấy số Farm
    
    @Autowired
    private TradingOrderServiceClient tradingOrderServiceClient; // Lấy số Order

    @GetMapping("/stats")
    @Operation(summary = "Lấy thống kê tổng quan", description = "Lấy tất cả thống kê cho Admin Dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // 1. Thống kê User (Query trực tiếp DB Admin)
        try {
            long totalUsers = userRepository.count();
            long totalManagers = userRepository.count((root, query, cb) -> {
                Join<Object, Object> roles = root.join("roles");
                return cb.equal(roles.get("name"), ERole.ROLE_FARMMANAGER);
            });
            stats.put("totalUsers", totalUsers);
            stats.put("totalFarmManagers", totalManagers);
        } catch (Exception e) {
            stats.put("totalUsers", 0);
            stats.put("totalFarmManagers", 0);
            stats.put("userError", e.getMessage());
        }

        // 2. Thống kê Farm (Gọi qua Feign)
        try {
            Long totalFarms = farmServiceClient.countTotalFarms();
            stats.put("totalFarms", totalFarms);
        } catch (Exception e) {
            stats.put("totalFarms", 0);
            stats.put("farmError", e.getMessage());
        }

        // 3. Thống kê Order (Gọi qua Feign từ Trading Order Service)
        try {
            Long totalOrders = tradingOrderServiceClient.countTotalOrders();
            stats.put("totalOrders", totalOrders);
            
            // Lấy thống kê chi tiết orders
            OrderStatisticsDTO orderStats = tradingOrderServiceClient.getOrderStatistics();
            stats.put("createdOrders", orderStats.getCreatedOrders());
            stats.put("confirmedOrders", orderStats.getConfirmedOrders());
            stats.put("completedOrders", orderStats.getCompletedOrders());
            stats.put("rejectedOrders", orderStats.getRejectedOrders());
        } catch (Exception e) {
            stats.put("totalOrders", 0);
            stats.put("orderError", e.getMessage());
        }

        return ResponseEntity.ok(stats);
    }
}

