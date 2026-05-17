package com.bicap.trading_order_service.exception.repository;

import com.bicap.trading_order_service.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    
    // Tìm category theo tên
    Optional<Category> findByName(String name);
    
    // Kiểm tra tên category đã tồn tại chưa
    boolean existsByName(String name);
    
    // Kiểm tra tên category đã tồn tại chưa (trừ category hiện tại - dùng cho update)
    boolean existsByNameAndIdNot(String name, Long id);
    
    // Lấy danh sách category đang active
    List<Category> findByIsActiveTrue();
    
    // Lấy tất cả category sắp xếp theo tên
    List<Category> findAllByOrderByNameAsc();
    
    // Lấy category active sắp xếp theo tên
    List<Category> findByIsActiveTrueOrderByNameAsc();
}
