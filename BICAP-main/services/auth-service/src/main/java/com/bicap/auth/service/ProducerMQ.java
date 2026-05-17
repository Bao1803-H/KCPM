package com.bicap.auth.service;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ProducerMQ {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Value("${bicap.auth.exchange:bicap.auth.exchange}")
    private String exchange;

    @Value("${bicap.auth.routing_key:bicap.auth.routing.key}")
    private String routingKey;

    public void sendFarmUserData(String type, Object dataObject) {
        rabbitTemplate.convertAndSend(exchange, routingKey, dataObject);
        System.out.println("The message is sent to the farm_production_service.");
    }
}
