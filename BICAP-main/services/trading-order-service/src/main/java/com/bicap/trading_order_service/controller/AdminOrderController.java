package com.bicap.trading_order_service.controller;

import com.bicap.trading_order_service.dto.OrderResponse;
import com.bicap.trading_order_service.dto.OrderStatisticsDTO;
import com.bicap.trading_order_service.service.IAdminOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/orders")
@Tag(name = "Admin Order API", description = "APIs quản lý đơn hàng dành cho Admin Service gọi")
public class AdminOrderController {

    private final IAdminOrderService adminOrderService;

    public AdminOrderController(IAdminOrderService adminOrderService) {
        this.adminOrderService = adminOrderService;
    }

    /**
     * GET /api/admin/orders - Lấy tất cả đơn hàng
     */
    @GetMapping
    @Operation(summary = "Lấy tất cả đơn hàng", description = "API cho Admin Service lấy tất cả đơn hàng")
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        return ResponseEntity.ok(adminOrderService.getAllOrders());
    }

    /**
     * GET /api/admin/orders/{orderId} - Lấy chi tiết đơn hàng
     */
    @GetMapping("/{orderId}")
    @Operation(summary = "Lấy chi tiết đơn hàng", description = "API cho Admin Service lấy chi tiết đơn hàng theo ID")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long orderId) {
        return ResponseEntity.ok(adminOrderService.getOrderById(orderId));
    }

    /**
     * GET /api/admin/orders/status/{status} - Lấy đơn hàng theo trạng thái
     */
    @GetMapping("/status/{status}")
    @Operation(summary = "Lấy đơn hàng theo trạng thái", 
               description = "API cho Admin Service lấy đơn hàng theo trạng thái: CREATED, CONFIRMED, COMPLETED, REJECTED")
    public ResponseEntity<List<OrderResponse>> getOrdersByStatus(
            @Parameter(description = "Trạng thái đơn hàng: CREATED, CONFIRMED, COMPLETED, REJECTED")
            @PathVariable String status) {
        return ResponseEntity.ok(adminOrderService.getOrdersByStatus(status));
    }

    /**
     * GET /api/admin/orders/count - Đếm tổng số đơn hàng
     */
    @GetMapping("/count")
    @Operation(summary = "Đếm tổng số đơn hàng", description = "API cho Admin Service đếm tổng số đơn hàng")
    public ResponseEntity<Long> countTotalOrders() {
        return ResponseEntity.ok(adminOrderService.countTotalOrders());
    }

    /**
     * GET /api/admin/orders/count/{status} - Đếm số đơn hàng theo trạng thái
     */
    @GetMapping("/count/{status}")
    @Operation(summary = "Đếm đơn hàng theo trạng thái", 
               description = "API cho Admin Service đếm số đơn hàng theo trạng thái")
    public ResponseEntity<Long> countOrdersByStatus(
            @Parameter(description = "Trạng thái đơn hàng: CREATED, CONFIRMED, COMPLETED, REJECTED")
            @PathVariable String status) {
        return ResponseEntity.ok(adminOrderService.countOrdersByStatus(status));
    }

    /**
     * GET /api/admin/orders/statistics - Thống kê đơn hàng
     */
    @GetMapping("/statistics")
    @Operation(summary = "Thống kê đơn hàng", description = "API cho Admin Service lấy thống kê đơn hàng")
    public ResponseEntity<OrderStatisticsDTO> getOrderStatistics() {
        return ResponseEntity.ok(adminOrderService.getOrderStatistics());
    }
}
