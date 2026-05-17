package com.bicap.trading_order_service.service.impl;

import com.bicap.trading_order_service.dto.CategoryRequestDTO;
import com.bicap.trading_order_service.dto.CategoryResponseDTO;
import com.bicap.trading_order_service.entity.Category;
import com.bicap.trading_order_service.exception.repository.CategoryRepository;
import com.bicap.trading_order_service.service.ICategoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements ICategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryServiceImpl(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    /**
     * Tạo danh mục mới
     */
    @Override
    @Transactional
    public CategoryResponseDTO createCategory(CategoryRequestDTO request) {
        // Kiểm tra tên danh mục đã tồn tại chưa
        if (categoryRepository.existsByName(request.getName())) {
            throw new RuntimeException("Danh mục với tên '" + request.getName() + "' đã tồn tại");
        }

        Category category = new Category();
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setIconUrl(request.getIconUrl());
        category.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);

        Category savedCategory = categoryRepository.save(category);
        return mapToDTO(savedCategory);
    }

    /**
     * Cập nhật danh mục
     */
    @Override
    @Transactional
    public CategoryResponseDTO updateCategory(Long id, CategoryRequestDTO request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với ID: " + id));

        // Kiểm tra tên danh mục đã tồn tại chưa (trừ chính nó)
        if (categoryRepository.existsByNameAndIdNot(request.getName(), id)) {
            throw new RuntimeException("Danh mục với tên '" + request.getName() + "' đã tồn tại");
        }

        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setIconUrl(request.getIconUrl());
        if (request.getIsActive() != null) {
            category.setIsActive(request.getIsActive());
        }

        Category updatedCategory = categoryRepository.save(category);
        return mapToDTO(updatedCategory);
    }

    /**
     * Lấy danh sách tất cả danh mục (dành cho Admin)
     */
    @Override
    public List<CategoryResponseDTO> getAllCategories() {
        return categoryRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách danh mục đang active (Public API - dành cho Farmer/User)
     */
    @Override
    public List<CategoryResponseDTO> getActiveCategories() {
        return categoryRepository.findByIsActiveTrueOrderByNameAsc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy chi tiết danh mục theo ID
     */
    @Override
    public CategoryResponseDTO getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với ID: " + id));
        return mapToDTO(category);
    }

    /**
     * Xóa danh mục (soft delete - chuyển thành inactive)
     */
    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với ID: " + id));
        category.setIsActive(false);
        categoryRepository.save(category);
    }

    /**
     * Xóa danh mục vĩnh viễn (hard delete)
     */
    @Override
    @Transactional
    public void hardDeleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy danh mục với ID: " + id);
        }
        categoryRepository.deleteById(id);
    }

    /**
     * Helper: Convert Entity sang DTO
     */
    private CategoryResponseDTO mapToDTO(Category category) {
        return CategoryResponseDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .iconUrl(category.getIconUrl())
                .isActive(category.getIsActive())
                .createdAt(category.getCreatedAt())
                .build();
    }
}
