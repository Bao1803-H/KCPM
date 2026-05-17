package com.bicap.shipping_manager_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * RabbitMQ Producer cho Shipment Status Updates
 * Gửi thông báo về trạng thái vận chuyển qua RabbitMQ thay vì HTTP calls
 */
@Service
@RequiredArgsConstructor
public class ShipmentProducer {

    private final RabbitTemplate rabbitTemplate;

    @Value("${bicap.rabbitmq.exchange:bicap.internal.exchange}")
    private String exchange;

    @Value("${bicap.rabbitmq.routing-key.shipment.status:shipment.status.routing.key}")
    private String routingKey;

    /**
     * Gửi thông báo cập nhật trạng thái vận chuyển qua RabbitMQ
     * @param orderId ID của đơn hàng
     * @param status Trạng thái mới (PENDING, ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED)
     */
    public void sendShipmentStatusUpdate(Long orderId, String status) {
        Map<String, Object> message = new HashMap<>();
        message.put("orderId", orderId);
        message.put("status", status);
        message.put("timestamp", System.currentTimeMillis());
        message.put("service", "shipping-manager-service");

        rabbitTemplate.convertAndSend(exchange, routingKey, message);
        System.out.println("✅ [RabbitMQ] Sent shipment update - Order ID: " + orderId + ", Status: " + status);
    }
}