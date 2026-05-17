package com.bicap.farm.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ Configuration for Notifications
 * 
 * This config creates:
 * - Exchange: notifications.exchange (topic)
 * - Queue: farm.notifications (durable)
 * - Bindings for farm.*, order.*, shipping.* routing keys
 */
@Configuration
public class RabbitMQConfig {
    
    public static final String NOTIFICATION_EXCHANGE = "notifications.exchange";
    public static final String NOTIFICATION_QUEUE = "farm.notifications";
    
    /**
     * Declare topic exchange for notifications
     */
    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange(NOTIFICATION_EXCHANGE, true, false);
    }
    
    /**
     * Declare notification queue (durable)
     */
    @Bean
    public Queue notificationQueue() {
        return new Queue(NOTIFICATION_QUEUE, true);
    }
    
    /**
     * Bind queue to exchange with farm.* pattern
     */
    @Bean
    public Binding farmBinding(Queue notificationQueue, TopicExchange notificationExchange) {
        return BindingBuilder
            .bind(notificationQueue)
            .to(notificationExchange)
            .with("farm.#");
    }
    
    /**
     * Bind queue to exchange with order.* pattern
     */
    @Bean
    public Binding orderBinding(Queue notificationQueue, TopicExchange notificationExchange) {
        return BindingBuilder
            .bind(notificationQueue)
            .to(notificationExchange)
            .with("order.#");
    }
    
    /**
     * Bind queue to exchange with shipping.* pattern
     */
    @Bean
    public Binding shippingBinding(Queue notificationQueue, TopicExchange notificationExchange) {
        return BindingBuilder
            .bind(notificationQueue)
            .to(notificationExchange)
            .with("shipping.#");
    }
    
    /**
     * JSON message converter for RabbitMQ
     */
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
    
    /**
     * RabbitTemplate with JSON converter
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
