package com.bicap.image_storage.controller;

import com.bicap.image_storage.dto.ImageResponse;
import com.bicap.image_storage.dto.ImageUploadResponse;
import com.bicap.image_storage.entity.ProductImage;
import com.bicap.image_storage.service.StorageService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

import java.io.InputStream;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/images")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
@RequiredArgsConstructor
public class ImageStorageController {

    private final StorageService storageService;

    @Value("${public.gateway.base-url:http://localhost:8000}")
    private String publicGatewayBaseUrl;

    private String publicImageUrl(Long imageId) {
        // IMPORTANT: return a browser-resolvable URL.
        // Using Kong public URL avoids Node "API proxy" corrupting binary image responses.
        return publicGatewayBaseUrl + "/api/images/" + imageId;
    }

    /**
     * Upload product image (Farm Manager only)
     */
    @PostMapping("/upload")
    public ResponseEntity<ImageUploadResponse> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("productId") Long productId,
            @RequestParam("farmId") Long farmId,
            HttpServletRequest request) {
        
        try {
            Long uploadedBy = extractUserId(request);
            
            ProductImage image = storageService.uploadImage(file, productId, farmId, uploadedBy);
            
            ImageUploadResponse response = new ImageUploadResponse(
                image.getId(),
                image.getFileName(),
                image.getOriginalName(),
                publicImageUrl(image.getId()),
                image.getFileSize(),
                image.getContentType(),
                "Image uploaded successfully"
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Error uploading image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ImageUploadResponse(null, null, null, null, null, null, 
                    "Failed to upload image: " + e.getMessage()));
        }
    }

    /**
     * Get image by ID (returns image file)
     */
    @GetMapping("/{imageId}")
    public void getImage(@PathVariable Long imageId, HttpServletResponse response) {
        try {
            ProductImage image = storageService.getImageById(imageId);
            InputStream imageStream = storageService.getImage(imageId);
            
            response.setContentType(image.getContentType());
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, 
                "inline; filename=\"" + image.getOriginalName() + "\"");
            
            imageStream.transferTo(response.getOutputStream());
            response.getOutputStream().flush();
        } catch (Exception e) {
            log.error("Error retrieving image", e);
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
        }
    }

    /**
     * Get image URL (returns JSON with URL)
     */
    @GetMapping("/{imageId}/url")
    public ResponseEntity<ImageResponse> getImageUrl(@PathVariable Long imageId) {
        try {
            ProductImage image = storageService.getImageById(imageId);
            ImageResponse response = mapToResponse(image);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error retrieving image URL", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Get all images for a product
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ImageResponse>> getProductImages(@PathVariable Long productId) {
        try {
            List<ProductImage> images = storageService.getProductImages(productId);
            List<ImageResponse> responses = images.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            log.error("Error retrieving product images", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete image (Farm Manager or Admin)
     */
    @DeleteMapping("/{imageId}")
    public ResponseEntity<String> deleteImage(@PathVariable Long imageId) {
        try {
            storageService.deleteImage(imageId);
            return ResponseEntity.ok("Image deleted successfully");
        } catch (Exception e) {
            log.error("Error deleting image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to delete image: " + e.getMessage());
        }
    }

    private ImageResponse mapToResponse(ProductImage image) {
        return new ImageResponse(
            image.getId(),
            image.getProductId(),
            image.getFarmId(),
            image.getFileName(),
            image.getOriginalName(),
            publicImageUrl(image.getId()),
            image.getFileSize(),
            image.getContentType(),
            image.getStatus(),
            image.getUploadedBy(),
            image.getCreatedAt()
        );
    }

    private Long extractUserId(HttpServletRequest request) {
        // Extract user ID from request attribute set by JwtAuthenticationFilter
        Object userIdObj = request.getAttribute("userId");
        if (userIdObj instanceof Number) {
            return ((Number) userIdObj).longValue();
        }
        
        // Fallback: try to extract from authentication
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() != null) {
            try {
                if (auth.getPrincipal() instanceof java.util.Map) {
                    @SuppressWarnings("unchecked")
                    java.util.Map<String, Object> principal = (java.util.Map<String, Object>) auth.getPrincipal();
                    Object userId = principal.get("userId");
                    if (userId instanceof Number) {
                        return ((Number) userId).longValue();
                    }
                }
            } catch (Exception e) {
                log.warn("Could not extract user ID from authentication", e);
            }
        }
        return 0L; // Default
    }
}
