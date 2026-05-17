package com.example.admin_service.client;

import com.example.admin_service.dto.AdminProductResponseDTO;
import com.example.admin_service.dto.BanProductRequestDTO;
import com.example.admin_service.dto.ProductStatisticsDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@FeignClient(name = "trading-order-service", contextId = "tradingProductServiceClient", url = "${trading-order.service.url:http://localhost:8082}")
public interface TradingProductServiceClient {

    /**
     * Lấy danh sách sản phẩm với bộ lọc
     */
    @GetMapping("/api/admin/products")
    Map<String, Object> getProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long farmId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    );

    /**
     * Lấy chi tiết sản phẩm theo ID
     */
    @GetMapping("/api/admin/products/{id}")
    AdminProductResponseDTO getProductById(@PathVariable("id") Long id);

    /**
     * Khóa sản phẩm
     */
    @PutMapping("/api/admin/products/{id}/ban")
    AdminProductResponseDTO banProduct(@PathVariable("id") Long id, @RequestBody BanProductRequestDTO request);

    /**
     * Mở khóa sản phẩm
     */
    @PutMapping("/api/admin/products/{id}/unban")
    AdminProductResponseDTO unbanProduct(@PathVariable("id") Long id);

    /**
     * Duyệt sản phẩm PENDING thành APPROVED
     */
    @PutMapping("/api/admin/products/{id}/approve")
    AdminProductResponseDTO approveProduct(@PathVariable("id") Long id);

    /**
     * Từ chối sản phẩm PENDING
     */
    @PutMapping("/api/admin/products/{id}/reject")
    AdminProductResponseDTO rejectProduct(@PathVariable("id") Long id, @RequestBody BanProductRequestDTO request);

    /**
     * Đếm số sản phẩm theo status
     */
    @GetMapping("/api/admin/products/count/{status}")
    Long countByStatus(@PathVariable("status") String status);

    /**
     * Lấy thống kê sản phẩm
     */
    @GetMapping("/api/admin/products/statistics")
    ProductStatisticsDTO getProductStatistics();
}
