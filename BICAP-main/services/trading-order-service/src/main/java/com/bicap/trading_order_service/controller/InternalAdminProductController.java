package com.bicap.trading_order_service.controller;

import com.bicap.trading_order_service.dto.ProductResponseDTO;
import com.bicap.trading_order_service.dto.BanProductRequestDTO;
import com.bicap.trading_order_service.dto.ProductStatisticsDTO;
import com.bicap.trading_order_service.entity.MarketplaceProduct;
import com.bicap.trading_order_service.exception.repository.MarketplaceProductRepository;
import com.bicap.trading_order_service.entity.FarmManager;
import com.bicap.trading_order_service.service.IProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Internal API cho Admin Service gọi (Service-to-Service communication)
 */
@RestController
@RequestMapping("/api/admin/products")
@Tag(name = "Internal Admin Product API", description = "APIs nội bộ cho Admin Service gọi")
public class InternalAdminProductController {

    private final MarketplaceProductRepository repository;
    private final IProductService adminProductService;

    @Autowired
    public InternalAdminProductController(MarketplaceProductRepository repository, IProductService adminProductService) {
        this.repository = repository;
        this.adminProductService = adminProductService;
    }

    /**
     * GET /api/admin/products - Filtered list for Admin
     */
    @GetMapping
    @Operation(summary = "Lấy danh sách sản phẩm", description = "Internal API cho Admin Service")
    public ResponseEntity<Page<ProductResponseDTO>> getProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long farmId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<ProductResponseDTO> products = adminProductService.getProductsWithFilter(keyword, status, farmId, page, size);
        return ResponseEntity.ok(products);
    }

    /**
     * GET /api/admin/products/{id} - Lấy chi tiết sản phẩm
     */
    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết sản phẩm", description = "Internal API cho Admin Service")
    public ResponseEntity<ProductResponseDTO> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(adminProductService.getProductById(id));
    }

    /**
     * PUT /api/admin/products/{id}/ban - Khóa sản phẩm
     */
    @PutMapping("/{id}/ban")
    @Operation(summary = "Khóa sản phẩm", description = "Internal API cho Admin Service")
    public ResponseEntity<ProductResponseDTO> banProduct(
            @PathVariable Long id,
            @Valid @RequestBody BanProductRequestDTO request
    ) {
        ProductResponseDTO bannedProduct = adminProductService.banProduct(id, request);
        return ResponseEntity.ok(bannedProduct);
    }

    /**
     * PUT /api/admin/products/{id}/unban - Mở khóa sản phẩm
     */
    @PutMapping("/{id}/unban")
    @Operation(summary = "Mở khóa sản phẩm", description = "Internal API cho Admin Service")
    public ResponseEntity<ProductResponseDTO> unbanProduct(@PathVariable Long id) {
        ProductResponseDTO unbannedProduct = adminProductService.unbanProduct(id);
        return ResponseEntity.ok(unbannedProduct);
    }

    /**
     * PUT /api/admin/products/{id}/approve - Duyệt sản phẩm PENDING thành APPROVED
     */
    @PutMapping("/{id}/approve")
    @Operation(summary = "Duyệt sản phẩm", description = "Internal API cho Admin Service duyệt sản phẩm PENDING thành APPROVED")
    public ResponseEntity<ProductResponseDTO> approveProduct(@PathVariable Long id) {
        MarketplaceProduct product = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        product.setStatus("APPROVED");
        repository.save(product);
        
        return ResponseEntity.ok(adminProductService.getProductById(id));
    }

    /**
     * PUT /api/admin/products/{id}/reject - Từ chối sản phẩm PENDING
     */
    @PutMapping("/{id}/reject")
    @Operation(summary = "Từ chối sản phẩm", description = "Internal API cho Admin Service từ chối sản phẩm PENDING")
    public ResponseEntity<ProductResponseDTO> rejectProduct(
            @PathVariable Long id,
            @Valid @RequestBody BanProductRequestDTO request
    ) {
        MarketplaceProduct product = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        product.setStatus("REJECTED");
        product.setBanReason(request.getReason());
        repository.save(product);
        
        return ResponseEntity.ok(adminProductService.getProductById(id));
    }

    /**
     * GET /api/admin/products/count/{status} - Đếm số sản phẩm theo status
     */
    @GetMapping("/count/{status}")
    @Operation(summary = "Đếm sản phẩm theo trạng thái", description = "Internal API cho Admin Service")
    public ResponseEntity<Long> countByStatus(@PathVariable String status) {
        return ResponseEntity.ok(adminProductService.countByStatus(status));
    }

    /**
     * GET /api/admin/products/statistics - Thống kê sản phẩm
     */
    @GetMapping("/statistics")
    @Operation(summary = "Thống kê sản phẩm", description = "Internal API cho Admin Service")
    public ResponseEntity<ProductStatisticsDTO> getProductStatistics() {
        ProductStatisticsDTO stats = ProductStatisticsDTO.builder()
                .totalActive(adminProductService.countByStatus("APPROVED"))
                .totalBanned(adminProductService.countByStatus("BANNED"))
                .totalOutOfStock(adminProductService.countByStatus("OUT_OF_STOCK"))
                .totalPending(adminProductService.countByStatus("PENDING"))
                .build();
        return ResponseEntity.ok(stats);
    }
}
