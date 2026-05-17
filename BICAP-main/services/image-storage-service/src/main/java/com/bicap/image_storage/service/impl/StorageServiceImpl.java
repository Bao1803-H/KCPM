package com.bicap.image_storage.service.impl;

import com.bicap.image_storage.entity.ProductImage;
import com.bicap.image_storage.repository.ProductImageRepository;
import com.bicap.image_storage.service.StorageService;
import io.minio.*;
import io.minio.errors.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StorageServiceImpl implements StorageService {

    private final MinioClient minioClient;
    private final ProductImageRepository imageRepository;

    @Value("${storage.bucket.name}")
    private String bucketName;

    @Value("${minio.endpoint}")
    private String minioEndpoint;

    @Override
    public ProductImage uploadImage(MultipartFile file, Long productId, Long farmId, Long uploadedBy) {
        try {
            // Validate file
            if (file.isEmpty()) {
                throw new IllegalArgumentException("File is empty");
            }

            String originalFilename = file.getOriginalFilename();
            String contentType = file.getContentType();
            long fileSize = file.getSize();

            // Validate content type
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new IllegalArgumentException("File must be an image");
            }

            // Generate unique file name
            String fileExtension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                : ".jpg";
            String fileName = UUID.randomUUID().toString() + fileExtension;
            
            // Storage path: products/{productId}/{fileName}
            String storagePath = String.format("products/%d/%s", productId, fileName);

            // Upload to MinIO
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(storagePath)
                    .stream(file.getInputStream(), fileSize, -1)
                    .contentType(contentType)
                    .build()
            );

            // Generate public URL (presigned URL or public URL)
            String storageUrl = generateImageUrl(storagePath);

            // Save metadata to database
            ProductImage productImage = new ProductImage();
            productImage.setProductId(productId);
            productImage.setFarmId(farmId);
            productImage.setFileName(fileName);
            productImage.setOriginalName(originalFilename);
            productImage.setContentType(contentType);
            productImage.setFileSize(fileSize);
            productImage.setStoragePath(storagePath);
            productImage.setStorageUrl(storageUrl);
            productImage.setStatus("ACTIVE");
            productImage.setUploadedBy(uploadedBy);
            productImage.setCreatedAt(LocalDateTime.now());
            productImage.setUpdatedAt(LocalDateTime.now());

            return imageRepository.save(productImage);
        } catch (Exception e) {
            log.error("Error uploading image", e);
            throw new RuntimeException("Failed to upload image: " + e.getMessage(), e);
        }
    }

    @Override
    public InputStream getImage(Long imageId) {
        try {
            ProductImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found with ID: " + imageId));

            if (!"ACTIVE".equals(image.getStatus())) {
                throw new RuntimeException("Image is not active");
            }

            return minioClient.getObject(
                GetObjectArgs.builder()
                    .bucket(bucketName)
                    .object(image.getStoragePath())
                    .build()
            );
        } catch (Exception e) {
            log.error("Error retrieving image", e);
            throw new RuntimeException("Failed to retrieve image: " + e.getMessage(), e);
        }
    }

    @Override
    public String getImageUrl(Long imageId) {
        ProductImage image = imageRepository.findById(imageId)
            .orElseThrow(() -> new RuntimeException("Image not found with ID: " + imageId));

        if (!"ACTIVE".equals(image.getStatus())) {
            throw new RuntimeException("Image is not active");
        }

        return image.getStorageUrl();
    }

    @Override
    public List<ProductImage> getProductImages(Long productId) {
        return imageRepository.findByProductIdAndStatus(productId, "ACTIVE");
    }

    @Override
    public void deleteImage(Long imageId) {
        try {
            ProductImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found with ID: " + imageId));

            // Delete from MinIO
            minioClient.removeObject(
                RemoveObjectArgs.builder()
                    .bucket(bucketName)
                    .object(image.getStoragePath())
                    .build()
            );

            // Soft delete in database
            image.setStatus("DELETED");
            image.setUpdatedAt(LocalDateTime.now());
            imageRepository.save(image);
        } catch (Exception e) {
            log.error("Error deleting image", e);
            throw new RuntimeException("Failed to delete image: " + e.getMessage(), e);
        }
    }

    @Override
    public ProductImage getImageById(Long imageId) {
        return imageRepository.findById(imageId)
            .orElseThrow(() -> new RuntimeException("Image not found with ID: " + imageId));
    }

    private String generateImageUrl(String storagePath) {
        // For MinIO, generate presigned URL or use public URL
        // In production, you might want to use presigned URLs with expiration
        try {
            // Generate presigned URL valid for 7 days
            return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .method(io.minio.http.Method.GET)
                    .bucket(bucketName)
                    .object(storagePath)
                    .expiry(7 * 24 * 60 * 60) // 7 days
                    .build()
            );
        } catch (Exception e) {
            log.warn("Failed to generate presigned URL, using direct URL", e);
            // Fallback to direct URL (requires public bucket policy)
            return String.format("%s/%s/%s", minioEndpoint, bucketName, storagePath);
        }
    }
}
