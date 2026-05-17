package com.bicap.image_storage.service;

import com.bicap.image_storage.entity.ProductImage;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;

public interface StorageService {
    
    /**
     * Upload product image
     * @param file Multipart file
     * @param productId Product ID
     * @param farmId Farm ID
     * @param uploadedBy User ID who uploaded
     * @return ProductImage entity
     */
    ProductImage uploadImage(MultipartFile file, Long productId, Long farmId, Long uploadedBy);
    
    /**
     * Get image as input stream
     * @param imageId Image ID
     * @return InputStream
     */
    InputStream getImage(Long imageId);
    
    /**
     * Get image URL
     * @param imageId Image ID
     * @return Public URL
     */
    String getImageUrl(Long imageId);
    
    /**
     * Get all images for a product
     * @param productId Product ID
     * @return List of ProductImage
     */
    List<ProductImage> getProductImages(Long productId);
    
    /**
     * Delete image
     * @param imageId Image ID
     */
    void deleteImage(Long imageId);
    
    /**
     * Get image by ID
     * @param imageId Image ID
     * @return ProductImage
     */
    ProductImage getImageById(Long imageId);
}
