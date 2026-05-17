package com.example.admin_service.controller;

import com.example.admin_service.client.TradingOrderServiceClient;
import com.example.admin_service.dto.OrderResponseDTO;
import com.example.admin_service.dto.OrderStatisticsDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/orders")
@Tag(name = "Admin Order Management", description = "APIs quản lý đơn hàng dành cho Admin")
public class AdminOrderController {

    @Autowired
    private TradingOrderServiceClient tradingOrderServiceClient;

    /**
     * GET /api/v1/admin/orders - Lấy tất cả đơn hàng
     */
    @GetMapping
    @Operation(summary = "Lấy tất cả đơn hàng", description = "Admin xem tất cả đơn hàng trong hệ thống")
    public ResponseEntity<List<OrderResponseDTO>> getAllOrders() {
        List<OrderResponseDTO> orders = tradingOrderServiceClient.getAllOrders();
        return ResponseEntity.ok(orders);
    }

    /**
     * GET /api/v1/admin/orders/{id} - Lấy chi tiết đơn hàng
     */
    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết đơn hàng", description = "Xem chi tiết một đơn hàng theo ID")
    public ResponseEntity<OrderResponseDTO> getOrderById(@PathVariable Long id) {
        OrderResponseDTO order = tradingOrderServiceClient.getOrderById(id);
        return ResponseEntity.ok(order);
    }

    /**
     * GET /api/v1/admin/orders/status/{status} - Lấy đơn hàng theo trạng thái
     */
    @GetMapping("/status/{status}")
    @Operation(summary = "Lấy đơn hàng theo trạng thái", 
               description = "Lấy danh sách đơn hàng theo trạng thái: CREATED, CONFIRMED, COMPLETED, REJECTED")
    public ResponseEntity<List<OrderResponseDTO>> getOrdersByStatus(
            @Parameter(description = "Trạng thái đơn hàng: CREATED, CONFIRMED, COMPLETED, REJECTED")
            @PathVariable String status) {
        List<OrderResponseDTO> orders = tradingOrderServiceClient.getOrdersByStatus(status);
        return ResponseEntity.ok(orders);
    }

    /**
     * GET /api/v1/admin/orders/by-farm/{farmId} - Lấy đơn hàng theo Farm
     */
    @GetMapping("/by-farm/{farmId}")
    @Operation(summary = "Lấy đơn hàng theo Farm", description = "Xem tất cả đơn hàng của một trang trại cụ thể")
    public ResponseEntity<List<OrderResponseDTO>> getOrdersByFarm(@PathVariable Long farmId) {
        List<OrderResponseDTO> orders = tradingOrderServiceClient.getOrdersByFarm(farmId);
        return ResponseEntity.ok(orders);
    }

    /**
     * GET /api/v1/admin/orders/statistics - Thống kê đơn hàng
     */
    @GetMapping("/statistics")
    @Operation(summary = "Thống kê đơn hàng", description = "Lấy số lượng đơn hàng theo từng trạng thái")
    public ResponseEntity<Map<String, Object>> getOrderStatistics() {
        Map<String, Object> stats = new HashMap<>();
        try {
            // Thử lấy statistics từ trading-order-service
            OrderStatisticsDTO statistics = tradingOrderServiceClient.getOrderStatistics();
            stats.put("totalOrders", statistics.getTotalOrders());
            stats.put("createdOrders", statistics.getCreatedOrders());
            stats.put("confirmedOrders", statistics.getConfirmedOrders());
            stats.put("completedOrders", statistics.getCompletedOrders());
            stats.put("rejectedOrders", statistics.getRejectedOrders());
        } catch (Exception e) {
            // Fallback: đếm từng trạng thái riêng lẻ
            try {
                stats.put("totalOrders", tradingOrderServiceClient.countTotalOrders());
                stats.put("createdOrders", tradingOrderServiceClient.countOrdersByStatus("CREATED"));
                stats.put("confirmedOrders", tradingOrderServiceClient.countOrdersByStatus("CONFIRMED"));
                stats.put("completedOrders", tradingOrderServiceClient.countOrdersByStatus("COMPLETED"));
                stats.put("rejectedOrders", tradingOrderServiceClient.countOrdersByStatus("REJECTED"));
            } catch (Exception ex) {
                stats.put("error", "Unable to fetch order statistics: " + ex.getMessage());
            }
        }
        return ResponseEntity.ok(stats);
    }

    /**
     * GET /api/v1/admin/orders/count - Đếm tổng số đơn hàng
     */
    @GetMapping("/count")
    @Operation(summary = "Đếm tổng số đơn hàng", description = "Lấy tổng số đơn hàng trong hệ thống")
    public ResponseEntity<Long> countTotalOrders() {
        Long count = tradingOrderServiceClient.countTotalOrders();
        return ResponseEntity.ok(count);
    }
}
