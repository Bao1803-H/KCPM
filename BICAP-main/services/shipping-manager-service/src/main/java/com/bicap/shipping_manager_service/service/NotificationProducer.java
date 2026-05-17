package com.bicap.shipping_manager_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * RabbitMQ Producer cho Manual Notifications
 * Cho phép Shipping Manager gửi notification thủ công đến Farm Management và Retailer
 */
@Service
@RequiredArgsConstructor
public class NotificationProducer {

    private final RabbitTemplate rabbitTemplate;

    @Value("${bicap.rabbitmq.exchange:bicap.internal.exchange}")
    private String exchange;

    @Value("${bicap.rabbitmq.routing-key.notification:notification.routing.key}")
    private String routingKey;

    /**
     * Gửi notification thủ công qua RabbitMQ
     * @param recipientType Loại người nhận: FARM_MANAGER, RETAILER, ALL
     * @param title Tiêu đề notification
     * @param message Nội dung notification
     * @param priority Mức độ ưu tiên: LOW, MEDIUM, HIGH, URGENT
     * @param relatedOrderId ID đơn hàng liên quan (nếu có)
     */
    public void sendManualNotification(String recipientType, String title, String message, String priority, Long relatedOrderId) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "MANUAL_NOTIFICATION");
        notification.put("recipientType", recipientType); // FARM_MANAGER, RETAILER, ALL
        notification.put("title", title);
        notification.put("message", message);
        notification.put("priority", priority != null ? priority : "MEDIUM");
        notification.put("sender", "SHIPPING_MANAGER");
        notification.put("timestamp", System.currentTimeMillis());
        notification.put("service", "shipping-manager-service");
        
        if (relatedOrderId != null) {
            notification.put("relatedOrderId", relatedOrderId);
        }

        rabbitTemplate.convertAndSend(exchange, routingKey, notification);
        System.out.println("✅ [RabbitMQ] Sent manual notification - Recipient: " + recipientType + ", Title: " + title);
    }
}
