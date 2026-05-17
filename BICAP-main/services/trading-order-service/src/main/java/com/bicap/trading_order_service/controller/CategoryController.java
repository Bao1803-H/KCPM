package com.bicap.trading_order_service.controller;

import com.bicap.trading_order_service.dto.CategoryResponseDTO;
import com.bicap.trading_order_service.service.ICategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@Tag(name = "Public Category API", description = "Public APIs để lấy danh sách danh mục (dùng cho Admin, Farmer, và User)")
public class CategoryController {

    private final ICategoryService categoryService;

    public CategoryController(ICategoryService categoryService) {
        this.categoryService = categoryService;
    }

    /**
     * GET /api/v1/categories - Lấy danh sách danh mục đang active
     * Public API cho tất cả người dùng (Admin, Farmer, Retailer, v.v.)
     */
    @GetMapping
    @Operation(summary = "Lấy danh sách danh mục", description = "Public API - Lấy tất cả danh mục đang active để hiển thị cho người dùng chọn")
    public ResponseEntity<List<CategoryResponseDTO>> getActiveCategories() {
        return ResponseEntity.ok(categoryService.getActiveCategories());
    }

    /**
     * GET /api/v1/categories/{id} - Lấy chi tiết danh mục theo ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết danh mục", description = "Public API - Lấy thông tin chi tiết của một danh mục")
    public ResponseEntity<CategoryResponseDTO> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }
}
