package com.bicap.image_storage.repository;

import com.bicap.image_storage.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    
    List<ProductImage> findByProductIdAndStatus(Long productId, String status);
    
    List<ProductImage> findByFarmIdAndStatus(Long farmId, String status);
    
    Optional<ProductImage> findByStoragePath(String storagePath);
    
    List<ProductImage> findByProductId(Long productId);
}
