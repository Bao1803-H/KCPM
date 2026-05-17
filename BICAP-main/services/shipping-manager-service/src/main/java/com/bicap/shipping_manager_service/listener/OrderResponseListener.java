package com.bicap.shipping_manager_service.listener;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * RabbitMQ Listener để nhận responses từ các services khác
 * Sử dụng RabbitMQ thay vì HTTP responses
 */
@Slf4j
@Component
public class OrderResponseListener {

    /**
     * Listener để nhận order responses từ Farm Service hoặc Trading Order Service
     * @param message Response message từ service khác
     */
    @RabbitListener(queues = "${bicap.rabbitmq.queue.order.response:shipping.order.response.queue}")
    public void receiveOrderResponse(Map<String, Object> message) {
        String correlationId = (String) message.get("correlationId");
        String action = (String) message.get("action");
        
        log.info("✅ [RabbitMQ] Received order response - Correlation ID: {}, Action: {}", 
                correlationId, action);
        
        // Process response based on action
        if ("GET_CONFIRMED_ORDERS".equals(action)) {
            handleConfirmedOrdersResponse(message);
        } else if ("GET_ORDER_DETAILS".equals(action)) {
            handleOrderDetailsResponse(message);
        } else {
            log.warn("⚠️ Unknown action in order response: {}", action);
        }
    }

    private void handleConfirmedOrdersResponse(Map<String, Object> message) {
        log.info("📦 Processing confirmed orders response");
        // TODO: Store response in cache or process immediately
        // For now, just log
        Object orders = message.get("orders");
        log.info("Received {} orders", orders != null ? "some" : "no");
    }

    private void handleOrderDetailsResponse(Map<String, Object> message) {
        log.info("📋 Processing order details response");
        // TODO: Store response in cache or process immediately
        Object orderDetails = message.get("orderDetails");
        log.info("Received order details: {}", orderDetails != null ? "yes" : "no");
    }
}
