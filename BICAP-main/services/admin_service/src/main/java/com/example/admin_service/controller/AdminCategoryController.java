package com.example.admin_service.controller;

import com.example.admin_service.client.TradingCategoryServiceClient;
import com.example.admin_service.dto.CategoryRequestDTO;
import com.example.admin_service.dto.CategoryResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/categories")
@Tag(name = "Admin Category Management", description = "APIs quản lý danh mục sản phẩm dành cho Admin")
public class AdminCategoryController {

    @Autowired
    private TradingCategoryServiceClient tradingCategoryServiceClient;

    /**
     * POST /api/v1/admin/categories - Tạo danh mục mới
     */
    @PostMapping
    @Operation(summary = "Tạo danh mục mới", description = "Admin tạo danh mục sản phẩm mới để Farmer có thể chọn khi đăng bài")
    public ResponseEntity<CategoryResponseDTO> createCategory(@Valid @RequestBody CategoryRequestDTO request) {
        CategoryResponseDTO createdCategory = tradingCategoryServiceClient.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCategory);
    }

    /**
     * PUT /api/v1/admin/categories/{id} - Cập nhật danh mục
     */
    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật danh mục", description = "Admin cập nhật tên/ảnh/mô tả danh mục")
    public ResponseEntity<CategoryResponseDTO> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequestDTO request) {
        CategoryResponseDTO updatedCategory = tradingCategoryServiceClient.updateCategory(id, request);
        return ResponseEntity.ok(updatedCategory);
    }

    /**
     * GET /api/v1/admin/categories - Lấy tất cả danh mục (bao gồm cả inactive)
     */
    @GetMapping
    @Operation(summary = "Lấy tất cả danh mục", description = "Admin xem tất cả danh mục (bao gồm cả danh mục đã ẩn)")
    public ResponseEntity<List<CategoryResponseDTO>> getAllCategories() {
        return ResponseEntity.ok(tradingCategoryServiceClient.getAllCategories());
    }

    /**
     * GET /api/v1/admin/categories/{id} - Lấy chi tiết danh mục
     */
    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết danh mục", description = "Xem chi tiết một danh mục theo ID")
    public ResponseEntity<CategoryResponseDTO> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(tradingCategoryServiceClient.getCategoryById(id));
    }

    /**
     * DELETE /api/v1/admin/categories/{id} - Xóa mềm danh mục (ẩn danh mục)
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Ẩn danh mục", description = "Soft delete - chuyển danh mục thành trạng thái inactive")
    public ResponseEntity<String> deleteCategory(@PathVariable Long id) {
        tradingCategoryServiceClient.deleteCategory(id);
        return ResponseEntity.ok("Đã ẩn danh mục thành công");
    }

    /**
     * DELETE /api/v1/admin/categories/{id}/permanent - Xóa vĩnh viễn danh mục
     */
    @DeleteMapping("/{id}/permanent")
    @Operation(summary = "Xóa vĩnh viễn danh mục", description = "Hard delete - xóa hoàn toàn danh mục khỏi database")
    public ResponseEntity<String> hardDeleteCategory(@PathVariable Long id) {
        tradingCategoryServiceClient.hardDeleteCategory(id);
        return ResponseEntity.ok("Đã xóa vĩnh viễn danh mục");
    }
}
