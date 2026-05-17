package com.bicap.farm_management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CreateMarketplaceProductRequest {
    @NotNull
    private Long farmId; // The ID of the farm owning the product

    @NotNull
    private Long exportBatchId; // Link to the validated Export Batch
    
    @NotBlank
    private String name;
    
    private String description;
    
    @NotNull
    @Positive
    private BigDecimal price;

    @NotNull
    private Integer quantity;

    @NotBlank
    private String unit;

    @NotBlank
    private String category;

    private String imageUrl;
}