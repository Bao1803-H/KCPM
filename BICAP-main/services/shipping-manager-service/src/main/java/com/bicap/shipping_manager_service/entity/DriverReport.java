package com.bicap.shipping_manager_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "driver_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriverReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @ManyToOne
    @JoinColumn(name = "shipment_id")
    private Shipment shipment;

    private String reportType; // INCIDENT, DELAY, COMPLETION, GENERAL
    private String title;
    private String description;
    private String status; // PENDING, REVIEWED, RESOLVED

    private LocalDateTime reportedAt;
    private LocalDateTime reviewedAt;

    @PrePersist
    protected void onCreate() {
        reportedAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
    }
}
