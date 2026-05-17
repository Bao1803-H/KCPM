package com.bicap.shipping_manager_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "admin_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long reporterId; // ID của Shipping Manager gửi report
    private String reporterRole; // ROLE_SHIPPINGMANAGER

    private String reportType; // SUMMARY, ISSUE, REQUEST, GENERAL
    private String title;
    private String description;
    private String priority; // LOW, MEDIUM, HIGH, URGENT
    private String status; // PENDING, REVIEWED, RESOLVED

    private LocalDateTime reportedAt;
    private LocalDateTime reviewedAt;

    @PrePersist
    protected void onCreate() {
        reportedAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
        if (priority == null) {
            priority = "MEDIUM";
        }
    }
}
