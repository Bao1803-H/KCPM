package com.bicap.trading_order_service.service;

import com.bicap.trading_order_service.dto.CategoryRequestDTO;
import com.bicap.trading_order_service.dto.CategoryResponseDTO;

import java.util.List;

public interface ICategoryService {
    
    // Admin APIs
    CategoryResponseDTO createCategory(CategoryRequestDTO request);
    CategoryResponseDTO updateCategory(Long id, CategoryRequestDTO request);
    List<CategoryResponseDTO> getAllCategories();
    void deleteCategory(Long id);
    void hardDeleteCategory(Long id);
    
    // Public APIs
    List<CategoryResponseDTO> getActiveCategories();
    CategoryResponseDTO getCategoryById(Long id);
}
