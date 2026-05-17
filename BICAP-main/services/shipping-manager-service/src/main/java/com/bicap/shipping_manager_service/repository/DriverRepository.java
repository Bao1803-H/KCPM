package com.bicap.shipping_manager_service.repository;

import com.bicap.shipping_manager_service.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {
    List<Driver> findByNameContainingIgnoreCase(String name);
    
    // Tìm tài xế theo giấy phép lái xe (để kiểm tra trùng)
    Optional<Driver> findByLicenseIgnoreCase(String license);
    
    // Tìm tài xế theo số căn cước công dân (để kiểm tra trùng)
    Optional<Driver> findByCitizenIdIgnoreCase(String citizenId);
    
    // Tìm tài xế theo userId từ Auth Service (cho mobile app driver)
    Optional<Driver> findByUserId(Long userId);
    
    // Tìm tài xế theo email (để auto-link khi đăng nhập)
    Optional<Driver> findByEmailIgnoreCase(String email);
}
