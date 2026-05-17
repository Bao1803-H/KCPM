package com.bicap.farm_management.controller;

import com.bicap.farm_management.dto.CreateMarketplaceProductRequest;
import com.bicap.farm_management.dto.ProductResponse;
import com.bicap.farm_management.entity.MarketplaceProduct;
import com.bicap.farm_management.service.IMarketplaceProductService;
import com.bicap.farm_management.service.ImageStorageService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/marketplace-products")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
@RequiredArgsConstructor
public class MarketplaceProductController {

    private final IMarketplaceProductService service;
    private final ImageStorageService imageStorageService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MarketplaceProduct createProduct(@Valid @RequestBody CreateMarketplaceProductRequest request) {
        return service.createProduct(request);
    }

    @GetMapping("/farm/{farmId}")
    public List<ProductResponse> getProductsByFarm(@PathVariable Long farmId) {
        return service.getProductsByFarm(farmId);
    }

    /**
     * Upload product image
     */
    @PostMapping("/{productId}/images")
    public ResponseEntity<Map<String, Object>> uploadProductImage(
            @PathVariable Long productId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("farmId") Long farmId,
            HttpServletRequest request) {
        
        try {
            // Extract auth token from request
            String authToken = extractAuthToken(request);
            
            // Upload image to image-storage-service
            String imageUrl = imageStorageService.uploadImage(file, productId, farmId, authToken);
            
            if (imageUrl != null) {
                // Update product with image URL
                MarketplaceProduct product = service.getProductById(productId);
                if (product != null) {
                    product.setImageUrl(imageUrl);
                    com.bicap.farm_management.dto.UpdateMarketplaceProductRequest updateReq =
                        new com.bicap.farm_management.dto.UpdateMarketplaceProductRequest();
                    updateReq.setName(product.getName());
                    updateReq.setDescription(product.getDescription());
                    updateReq.setPrice(product.getPrice());
                    updateReq.setUnit(product.getUnit());
                    updateReq.setQuantity(product.getQuantity());
                    updateReq.setCategory(product.getCategory());
                    updateReq.setImageUrl(imageUrl);
                    service.updateProduct(productId, updateReq);
                }
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("imageUrl", imageUrl);
                response.put("message", "Image uploaded successfully");
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Failed to upload image");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error uploading image: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get product images
     */
    @GetMapping("/{productId}/images")
    public ResponseEntity<List<Map<String, Object>>> getProductImages(@PathVariable Long productId) {
        try {
            List<Map<String, Object>> images = imageStorageService.getProductImages(productId);
            return ResponseEntity.ok(images);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/debug/auth")
    public ResponseEntity<Map<String, Object>> debugAuth() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> info = new HashMap<>();
        
        if (authentication == null) {
            info.put("authenticated", false);
            info.put("message", "No authentication found");
        } else {
            info.put("authenticated", true);
            info.put("username", authentication.getName());
            List<String> authorities = authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());
            info.put("authorities", authorities);
            info.put("authoritiesCount", authorities.size());
            info.put("hasROLE_FARMMANAGER", authorities.contains("ROLE_FARMMANAGER"));
            info.put("hasROLE_ADMIN", authorities.contains("ROLE_ADMIN"));
            info.put("principal", authentication.getPrincipal().getClass().getSimpleName());
            info.put("canAccess", authorities.contains("ROLE_FARMMANAGER") || authorities.contains("ROLE_ADMIN"));
        }
        
        return ResponseEntity.ok(info);
    }

    private String extractAuthToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        
        // Try to get from cookies
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("auth_token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        
        return null;
    }
}
