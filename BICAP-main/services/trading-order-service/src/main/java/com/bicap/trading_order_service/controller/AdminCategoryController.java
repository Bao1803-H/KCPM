package com.bicap.trading_order_service.controller;

import com.bicap.trading_order_service.dto.CategoryRequestDTO;
import com.bicap.trading_order_service.dto.CategoryResponseDTO;
import com.bicap.trading_order_service.service.ICategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/categories")
@Tag(name = "Admin Category API", description = "APIs quản lý danh mục dành cho Admin Service gọi")
public class AdminCategoryController {

    private final ICategoryService categoryService;

    public AdminCategoryController(ICategoryService categoryService) {
        this.categoryService = categoryService;
    }

    /**
     * POST /api/admin/categories - Tạo danh mục mới
     */
    @PostMapping
    @Operation(summary = "Tạo danh mục mới", description = "API cho Admin Service tạo danh mục mới")
    public ResponseEntity<CategoryResponseDTO> createCategory(@Valid @RequestBody CategoryRequestDTO request) {
        CategoryResponseDTO createdCategory = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCategory);
    }

    /**
     * PUT /api/admin/categories/{id} - Cập nhật danh mục
     */
    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật danh mục", description = "API cho Admin Service cập nhật danh mục")
    public ResponseEntity<CategoryResponseDTO> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequestDTO request) {
        CategoryResponseDTO updatedCategory = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(updatedCategory);
    }

    /**
     * GET /api/admin/categories - Lấy tất cả danh mục (bao gồm cả inactive)
     */
    @GetMapping
    @Operation(summary = "Lấy tất cả danh mục", description = "API cho Admin Service lấy tất cả danh mục")
    public ResponseEntity<List<CategoryResponseDTO>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    /**
     * GET /api/admin/categories/{id} - Lấy chi tiết danh mục
     */
    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết danh mục", description = "API cho Admin Service lấy chi tiết danh mục")
    public ResponseEntity<CategoryResponseDTO> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }

    /**
     * DELETE /api/admin/categories/{id} - Xóa mềm danh mục
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Ẩn danh mục", description = "API cho Admin Service soft delete danh mục")
    public ResponseEntity<String> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok("Đã ẩn danh mục thành công");
    }

    /**
     * DELETE /api/admin/categories/{id}/permanent - Xóa vĩnh viễn danh mục
     */
    @DeleteMapping("/{id}/permanent")
    @Operation(summary = "Xóa vĩnh viễn danh mục", description = "API cho Admin Service hard delete danh mục")
    public ResponseEntity<String> hardDeleteCategory(@PathVariable Long id) {
        categoryService.hardDeleteCategory(id);
        return ResponseEntity.ok("Đã xóa vĩnh viễn danh mục");
    }
}
