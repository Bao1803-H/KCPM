package com.bicap.farm_management.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ProductProducerMQ {

    private static final Logger LOGGER = LoggerFactory.getLogger(ProductProducerMQ.class);

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Value("${bicap.farm.product.exchange:bicap.product.exchange}")
    private String productExchange;

    @Value("${bicap.farm.product.routing_key:product.routing_key}")
    private String productRoutingKey;

    public void sendMessageToTradingOrderService(String type, Object dataObject) {
        try {
            LOGGER.info("Sending message to Exchange: {} | Routing Key: {}", productExchange, productRoutingKey);
            rabbitTemplate.convertAndSend(productExchange, productRoutingKey, dataObject);
            LOGGER.info("The message is broadcast to the directed service");
        } catch (Exception e) {
            LOGGER.error("❌ Error sending message to trading-order-service: {}", e.getMessage());
        }
    }
}
