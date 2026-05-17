package com.example.admin_service.client;

import com.example.admin_service.dto.OrderResponseDTO;
import com.example.admin_service.dto.OrderStatisticsDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "trading-order-service", contextId = "tradingOrderServiceClient", url = "${trading-order.service.url:http://localhost:8082}")
public interface TradingOrderServiceClient {

    /**
     * Lấy tất cả đơn hàng (dành cho Admin)
     */
    @GetMapping("/api/admin/orders")
    List<OrderResponseDTO> getAllOrders();

    /**
     * Lấy danh sách đơn hàng theo trạng thái
     */
    @GetMapping("/api/admin/orders/status/{status}")
    List<OrderResponseDTO> getOrdersByStatus(@PathVariable("status") String status);

    /**
     * Lấy chi tiết đơn hàng theo ID
     */
    @GetMapping("/api/admin/orders/{orderId}")
    OrderResponseDTO getOrderById(@PathVariable("orderId") Long orderId);

    /**
     * Lấy danh sách đơn hàng theo Farm ID
     */
    @GetMapping("/api/orders/by-farm/{farmId}")
    List<OrderResponseDTO> getOrdersByFarm(@PathVariable("farmId") Long farmId);

    /**
     * Đếm tổng số đơn hàng
     */
    @GetMapping("/api/admin/orders/count")
    Long countTotalOrders();

    /**
     * Đếm số đơn hàng theo trạng thái
     */
    @GetMapping("/api/admin/orders/count/{status}")
    Long countOrdersByStatus(@PathVariable("status") String status);

    /**
     * Lấy thống kê đơn hàng
     */
    @GetMapping("/api/admin/orders/statistics")
    OrderStatisticsDTO getOrderStatistics();
}
