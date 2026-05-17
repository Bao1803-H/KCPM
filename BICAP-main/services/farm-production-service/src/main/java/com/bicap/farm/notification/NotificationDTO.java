package com.bicap.farm.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for sending notifications via RabbitMQ
 * 
 * Example usage:
 * 
 * NotificationDTO notification = NotificationDTO.builder()
 *     .type("success")
 *     .title("Đơn hàng mới")
 *     .message("Bạn có đơn hàng mới #12345")
 *     .from("Order Service")
 *     .build();
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    
    /**
     * Type of notification:
     * - "success" (green)
     * - "info" (blue)
     * - "warning" (yellow)
     * - "error" (red)
     * - "order" (blue with shopping cart icon)
     * - "shipping" (gray with truck icon)
     */
    private String type;
    
    /**
     * Notification title
     */
    private String title;
    
    /**
     * Notification message/content
     */
    private String message;
    
    /**
     * Source service name (optional)
     */
    private String from;
    
    /**
     * Timestamp (auto-set if not provided)
     */
    @Builder.Default
    private String timestamp = Instant.now().toString();
    
    /**
     * Unique ID (optional, auto-generated on frontend if not provided)
     */
    private String id;
}
