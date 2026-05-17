package com.bicap.farm_management.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "product_listings")
public class ProductListing {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tiêu đề bài đăng (VD: Cà chua sạch Đà Lạt - Vụ Đông 2025)
    private String title;
    
    private Double pricePerUnit; // Giá bán mỗi đơn vị (VD: 20.000 đ/kg)
    private Double availableQuantity; // Số lượng còn lại
    private String description;
    
    private String status; // ACTIVE (Đang bán), SOLD_OUT (Hết hàng), CLOSED (Đóng)
    private LocalDateTime listedAt;

    // Nối với Lô Xuất Kho (Một bài đăng bán một lô hàng cụ thể)
    @OneToOne
    @JoinColumn(name = "export_batch_id")
    private ExportBatch exportBatch;
}