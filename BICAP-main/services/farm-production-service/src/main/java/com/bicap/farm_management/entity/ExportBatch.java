package com.bicap.farm_management.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "export_batches")
@Data
public class ExportBatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "batch_id", nullable = false)
    private ProductionBatch productionBatch; // Xuất từ mùa vụ nào

    @Column(name = "export_code", unique = true)
    private String batchCode; // Mã in trên bao bì

    private Double quantity;
    private String unit; // kg, tấn, hộp...

    @Column(name = "qr_code", columnDefinition = "TEXT")
    private String qrCodeUrl;

    @Column(name = "export_date")
    private LocalDateTime exportDate = LocalDateTime.now();

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    // --- BLOCKCHAIN FIELDS ---
    @Column(name = "tx_hash")
    private String txHash; // Mã giao dịch chứng thực xuất hàng
    @Column(columnDefinition = "TEXT") // Dùng TEXT để chứa chuỗi Base64 dài
    private String qrCodeImage; // Ảnh QR Code dạng Base64 để hiển thị nhanh

    @JsonIgnore
    @OneToOne(mappedBy = "exportBatch")
    private MarketplaceProduct marketplaceProduct;

    @ManyToOne
    @JoinColumn(name = "farm_id")
    private Farm farm;
}