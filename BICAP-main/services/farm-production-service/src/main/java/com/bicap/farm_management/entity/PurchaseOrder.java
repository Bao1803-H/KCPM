package com.bicap.farm_management.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "purchase_orders")
public class PurchaseOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long retailerId; // ID của người mua (Retailer)
    private Double quantity; // Số lượng mua
    private Double totalPrice; // Tổng tiền
    
    // PENDING (Chờ duyệt), CONFIRMED (Đã chốt), REJECTED (Từ chối)
    private String status;
    private String note; // Ghi chú của người mua
    private LocalDateTime orderDate;

    // Đơn hàng này thuộc về bài đăng nào
    @ManyToOne
    @JoinColumn(name = "listing_id")
    private ProductListing productListing;
}