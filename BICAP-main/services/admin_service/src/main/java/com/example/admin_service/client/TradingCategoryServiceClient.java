package com.example.admin_service.client;

import com.example.admin_service.dto.CategoryRequestDTO;
import com.example.admin_service.dto.CategoryResponseDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@FeignClient(name = "trading-category-service", url = "${trading-order.service.url:http://localhost:8083}")
public interface TradingCategoryServiceClient {

    /**
     * Tạo danh mục mới
     */
    @PostMapping("/api/admin/categories")
    CategoryResponseDTO createCategory(@RequestBody CategoryRequestDTO request);

    /**
     * Cập nhật danh mục
     */
    @PutMapping("/api/admin/categories/{id}")
    CategoryResponseDTO updateCategory(@PathVariable("id") Long id, @RequestBody CategoryRequestDTO request);

    /**
     * Lấy tất cả danh mục (bao gồm cả inactive)
     */
    @GetMapping("/api/admin/categories")
    List<CategoryResponseDTO> getAllCategories();

    /**
     * Lấy chi tiết danh mục theo ID
     */
    @GetMapping("/api/admin/categories/{id}")
    CategoryResponseDTO getCategoryById(@PathVariable("id") Long id);

    /**
     * Xóa mềm danh mục (ẩn danh mục)
     */
    @DeleteMapping("/api/admin/categories/{id}")
    void deleteCategory(@PathVariable("id") Long id);

    /**
     * Xóa vĩnh viễn danh mục
     */
    @DeleteMapping("/api/admin/categories/{id}/permanent")
    void hardDeleteCategory(@PathVariable("id") Long id);

    /**
     * Lấy danh sách danh mục active (Public API)
     */
    @GetMapping("/api/categories")
    List<CategoryResponseDTO> getActiveCategories();
}
