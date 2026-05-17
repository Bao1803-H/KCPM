package com.bicap.farm_management.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "farming_processes")
public class FarmingProcess {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Loại hoạt động: SOWING (Gieo), WATERING (Tưới), FERTILIZING (Bón phân)...
    @Column(nullable = false)
    private String processType;

    private String description; // Mô tả chi tiết (VD: Bón 50kg phân NPK)

    private LocalDateTime performedDate; // Thời gian thực hiện

    private String txHash; // Mã Hash trên Blockchain (Chứng minh đã làm thật)
    private String status; // PENDING_BLOCKCHAIN, SYNCED

    // QUAN TRỌNG: Nối với Lô Sản Xuất (ProductionBatch)
    @ManyToOne
    @JoinColumn(name = "production_batch_id", nullable = false)
    private ProductionBatch productionBatch;
}