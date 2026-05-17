package com.bicap.shipping_manager_service.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ Configuration cho Shipping Manager Service
 * Sử dụng RabbitMQ cho inter-service communication thay vì HTTP calls
 */
@Configuration
public class RabbitMQConfig {

    // Exchange name
    @Value("${bicap.rabbitmq.exchange:bicap.internal.exchange}")
    private String exchangeName;

    // Queue names
    @Value("${bicap.rabbitmq.queue.shipment.status:shipping.shipment.status.queue}")
    private String shipmentStatusQueue;

    @Value("${bicap.rabbitmq.queue.order.request:shipping.order.request.queue}")
    private String orderRequestQueue;

    @Value("${bicap.rabbitmq.queue.order.response:shipping.order.response.queue}")
    private String orderResponseQueue;

    @Value("${bicap.rabbitmq.queue.notification:shipping.notification.queue}")
    private String notificationQueue;

    // Routing keys
    @Value("${bicap.rabbitmq.routing-key.shipment.status:shipment.status.routing.key}")
    private String shipmentStatusRoutingKey;

    @Value("${bicap.rabbitmq.routing-key.order.request:order.request.routing.key}")
    private String orderRequestRoutingKey;

    @Value("${bicap.rabbitmq.routing-key.order.response:order.response.routing.key}")
    private String orderResponseRoutingKey;

    @Value("${bicap.rabbitmq.routing-key.notification:notification.routing.key}")
    private String notificationRoutingKey;

    // Exchange
    @Bean
    public TopicExchange internalExchange() {
        return new TopicExchange(exchangeName, true, false);
    }

    // Order Exchange (from trading-order-service)
    @Bean
    public TopicExchange orderExchange() {
        return new TopicExchange("bicap.order.exchange", true, false);
    }

    // Queues
    @Bean
    public Queue shipmentStatusQueue() {
        return new Queue(shipmentStatusQueue, true);
    }

    @Bean
    public Queue orderRequestQueue() {
        return new Queue(orderRequestQueue, true);
    }

    @Bean
    public Queue orderResponseQueue() {
        return new Queue(orderResponseQueue, true);
    }

    @Bean
    public Queue notificationQueue() {
        return new Queue(notificationQueue, true);
    }

    // Order event queues (from trading-order-service)
    @Bean
    public Queue orderCreatedQueue() {
        return new Queue("bicap.order.created.queue", true);
    }

    @Bean
    public Queue orderConfirmedQueue() {
        return new Queue("bicap.order.confirmed.queue", true);
    }

    // Bindings
    @Bean
    public Binding shipmentStatusBinding() {
        return BindingBuilder.bind(shipmentStatusQueue())
                .to(internalExchange())
                .with(shipmentStatusRoutingKey);
    }

    @Bean
    public Binding orderRequestBinding() {
        return BindingBuilder.bind(orderRequestQueue())
                .to(internalExchange())
                .with(orderRequestRoutingKey);
    }

    @Bean
    public Binding orderResponseBinding() {
        return BindingBuilder.bind(orderResponseQueue())
                .to(internalExchange())
                .with(orderResponseRoutingKey);
    }

    @Bean
    public Binding notificationBinding() {
        return BindingBuilder.bind(notificationQueue())
                .to(internalExchange())
                .with(notificationRoutingKey);
    }

    // Order event bindings (from trading-order-service)
    @Bean
    public Binding orderCreatedBinding() {
        return BindingBuilder.bind(orderCreatedQueue())
                .to(orderExchange())
                .with("bicap.order.created.key");
    }

    @Bean
    public Binding orderConfirmedBinding() {
        return BindingBuilder.bind(orderConfirmedQueue())
                .to(orderExchange())
                .with("bicap.order.confirmed.key");
    }

    // Message Converter
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    // RabbitTemplate với message converter
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }

    // Constants for backward compatibility
    public static final String EXCHANGE = "bicap.internal.exchange";
    public static final String ROUTING_KEY = "shipment.status.routing.key";
}