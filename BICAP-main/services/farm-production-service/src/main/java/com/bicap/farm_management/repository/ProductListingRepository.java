package com.bicap.farm_management.repository;

import com.bicap.farm_management.entity.ProductListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductListingRepository extends JpaRepository<ProductListing, Long> {
    // Tìm các bài đăng đang mở bán (Status = ACTIVE)
    List<ProductListing> findByStatus(String status);
}