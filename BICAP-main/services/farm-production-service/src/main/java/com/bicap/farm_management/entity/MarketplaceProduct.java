// MarketplaceProduct.java
package com.bicap.farm_management.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Data
@Entity
@Table(name = "marketplace_products")
public class MarketplaceProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "export_batch_id", referencedColumnName = "id", unique = true)
    private ExportBatch exportBatch; // Direct link to traceability data
    
    private String name;
    private String description;
    private BigDecimal price;
    private String unit;
    private Integer quantity;
    private String category;

    @Column(name = "image_url")
    private String imageUrl;

    private String status; // e.g., PENDING, APPROVED, BANNED

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "farm_id", nullable = false)
    @JsonIgnoreProperties({"exportBatches", "productionBatches"})
    private Farm farm;
}