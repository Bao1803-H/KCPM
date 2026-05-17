package com.bicap.shipping_manager_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * RabbitMQ Producer cho Order Requests
 * Gửi yêu cầu lấy danh sách orders qua RabbitMQ thay vì HTTP calls
 */
@Service
@RequiredArgsConstructor
public class OrderRequestProducer {

    private final RabbitTemplate rabbitTemplate;

    @Value("${bicap.rabbitmq.exchange:bicap.internal.exchange}")
    private String exchange;

    @Value("${bicap.rabbitmq.routing-key.order.request:order.request.routing.key}")
    private String routingKey;

    /**
     * Gửi yêu cầu lấy danh sách confirmed orders qua RabbitMQ
     * @param userToken JWT token của user (nếu cần)
     * @param correlationId ID để track request-response
     */
    public void requestConfirmedOrders(String userToken, String correlationId) {
        Map<String, Object> message = new HashMap<>();
        message.put("action", "GET_CONFIRMED_ORDERS");
        message.put("userToken", userToken);
        message.put("correlationId", correlationId);
        message.put("timestamp", System.currentTimeMillis());
        message.put("requester", "shipping-manager-service");

        rabbitTemplate.convertAndSend(exchange, routingKey, message);
        System.out.println("✅ [RabbitMQ] Sent order request - Correlation ID: " + correlationId);
    }

    /**
     * Gửi yêu cầu lấy chi tiết order qua RabbitMQ
     * @param orderId ID của order
     * @param correlationId ID để track request-response
     */
    public void requestOrderDetails(Long orderId, String correlationId) {
        Map<String, Object> message = new HashMap<>();
        message.put("action", "GET_ORDER_DETAILS");
        message.put("orderId", orderId);
        message.put("correlationId", correlationId);
        message.put("timestamp", System.currentTimeMillis());
        message.put("requester", "shipping-manager-service");

        rabbitTemplate.convertAndSend(exchange, routingKey, message);
        System.out.println("✅ [RabbitMQ] Sent order details request - Order ID: " + orderId + ", Correlation ID: " + correlationId);
    }
}
