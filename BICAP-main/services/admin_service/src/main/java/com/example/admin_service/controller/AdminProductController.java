package com.example.admin_service.controller;

import com.example.admin_service.client.TradingProductServiceClient;
import com.example.admin_service.dto.AdminProductResponseDTO;
import com.example.admin_service.dto.BanProductRequestDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/products")
@Tag(name = "Admin Product Monitoring", description = "APIs giám sát sản phẩm dành cho Admin")
public class AdminProductController {

    @Autowired
    private TradingProductServiceClient tradingProductServiceClient;

    /**
     * GET /api/v1/admin/products - Lấy danh sách sản phẩm với bộ lọc
     */
    @GetMapping
    @Operation(summary = "Lấy danh sách sản phẩm", 
               description = "Admin xem danh sách sản phẩm với bộ lọc: keyword, status (ACTIVE/BANNED/OUT_OF_STOCK), farmId")
    public ResponseEntity<Map<String, Object>> getProducts(
            @Parameter(description = "Từ khóa tìm kiếm theo tên sản phẩm")
            @RequestParam(required = false) String keyword,
            
            @Parameter(description = "Trạng thái sản phẩm: ACTIVE, BANNED, OUT_OF_STOCK")
            @RequestParam(required = false) String status,
            
            @Parameter(description = "ID trang trại")
            @RequestParam(required = false) Long farmId,
            
            @Parameter(description = "Số trang (bắt đầu từ 0)")
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Số lượng mỗi trang")
            @RequestParam(defaultValue = "10") int size
    ) {
        Map<String, Object> products = tradingProductServiceClient.getProducts(keyword, status, farmId, page, size);
        return ResponseEntity.ok(products);
    }

    /**
     * GET /api/v1/admin/products/{id} - Lấy chi tiết sản phẩm
     */
    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết sản phẩm", description = "Xem chi tiết một sản phẩm theo ID")
    public ResponseEntity<AdminProductResponseDTO> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(tradingProductServiceClient.getProductById(id));
    }

    /**
     * PUT /api/v1/admin/products/{id}/ban - Khóa sản phẩm
     */
    @PutMapping("/{id}/ban")
    @Operation(summary = "Khóa sản phẩm", 
               description = "Admin khóa sản phẩm vi phạm. Cần cung cấp lý do khóa.")
    public ResponseEntity<AdminProductResponseDTO> banProduct(
            @PathVariable Long id,
            @Valid @RequestBody BanProductRequestDTO request
    ) {
        AdminProductResponseDTO bannedProduct = tradingProductServiceClient.banProduct(id, request);
        return ResponseEntity.ok(bannedProduct);
    }

    /**
     * PUT /api/v1/admin/products/{id}/unban - Mở khóa sản phẩm
     */
    @PutMapping("/{id}/unban")
    @Operation(summary = "Mở khóa sản phẩm", 
               description = "Admin mở khóa sản phẩm sau khi Farmer đã sửa lỗi và khiếu nại thành công")
    public ResponseEntity<AdminProductResponseDTO> unbanProduct(@PathVariable Long id) {
        AdminProductResponseDTO unbannedProduct = tradingProductServiceClient.unbanProduct(id);
        return ResponseEntity.ok(unbannedProduct);
    }

    /**
     * GET /api/v1/admin/products/count/{status} - Đếm sản phẩm theo status
     */
    @GetMapping("/count/{status}")
    public ResponseEntity<Long> countByStatus(@PathVariable String status) {
        return ResponseEntity.ok(tradingProductServiceClient.countByStatus(status));
    }

    /**
     * PUT /api/v1/admin/products/{id}/approve - Duyệt sản phẩm PENDING
     */
    @PutMapping("/{id}/approve")
    @Operation(summary = "Duyệt sản phẩm", description = "Admin duyệt sản phẩm PENDING lên sàn")
    public ResponseEntity<AdminProductResponseDTO> approveProduct(@PathVariable Long id) {
        AdminProductResponseDTO approvedProduct = tradingProductServiceClient.approveProduct(id);
        return ResponseEntity.ok(approvedProduct);
    }

    /**
     * PUT /api/v1/admin/products/{id}/reject - Từ chối sản phẩm PENDING
     */
    @PutMapping("/{id}/reject")
    @Operation(summary = "Từ chối sản phẩm", description = "Admin từ chối sản phẩm PENDING với lý do")
    public ResponseEntity<AdminProductResponseDTO> rejectProduct(
            @PathVariable Long id,
            @Valid @RequestBody BanProductRequestDTO request
    ) {
        AdminProductResponseDTO rejectedProduct = tradingProductServiceClient.rejectProduct(id, request);
        return ResponseEntity.ok(rejectedProduct);
    }

    /**
     * GET /api/v1/admin/products/statistics - Thống kê sản phẩm
     */
    @GetMapping("/statistics")
    @Operation(summary = "Thống kê sản phẩm", description = "Lấy số lượng sản phẩm theo từng trạng thái")
    public ResponseEntity<Map<String, Object>> getProductStatistics() {
        Map<String, Object> stats = new HashMap<>();
        try {
            stats.put("totalActive", tradingProductServiceClient.countByStatus("APPROVED"));
            stats.put("totalBanned", tradingProductServiceClient.countByStatus("BANNED"));
            stats.put("totalOutOfStock", tradingProductServiceClient.countByStatus("OUT_OF_STOCK"));
            stats.put("totalPending", tradingProductServiceClient.countByStatus("PENDING"));
        } catch (Exception e) {
            stats.put("error", "Unable to fetch product statistics: " + e.getMessage());
        }
        return ResponseEntity.ok(stats);
    }
}
