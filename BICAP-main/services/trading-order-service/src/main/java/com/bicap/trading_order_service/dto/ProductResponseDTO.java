package com.bicap.trading_order_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponseDTO {
    
    private Long id;
    private String name;
    private String category;
    private String categoryName;
    private String description;
    private Integer quantity;
    private String unit;
    private Double price;
    private String imageUrl;
    private String status;
    private String batchId;
    private LocalDateTime createdAt;
    
    // Thông tin Farm
    private Long farmId;
    private String farmName;
    private String ownerName;
    
    // Thông tin User (Farm Manager)
    private Long farmManagerId;
    private String farmManagerUsername;
    private String farmManagerEmail;
    
    // Thông tin ban (nếu có)
    private String banReason;
    
    // Thông tin category
    private Long categoryId;
    
    // Stock
    private Integer stockQuantity;
}
