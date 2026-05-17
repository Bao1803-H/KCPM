package com.bicap.farm_management.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "environment_metrics")
public class EnvironmentMetric {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // === 3 TRƯỜNG QUAN TRỌNG (Service sẽ gọi set vào đây) ===
    private String metricType; // Lưu chữ: "TEMPERATURE" hoặc "HUMIDITY"
    private Double value;      // Lưu số: 30.5, 80.0...
    private String unit;       // Lưu đơn vị: "Celsius", "%"
    
    private LocalDateTime recordedAt;

    @ManyToOne
    @JoinColumn(name = "production_batch_id")
    private ProductionBatch productionBatch;

    @ManyToOne
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farmId;
}