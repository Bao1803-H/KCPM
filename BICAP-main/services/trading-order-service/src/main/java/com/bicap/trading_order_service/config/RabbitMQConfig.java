package com.bicap.trading_order_service.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // --- Order Service Events ---
    public static final String ORDER_EXCHANGE = "bicap.order.exchange";
    public static final String ORDER_COMPLETED_QUEUE = "bicap.order.completed.queue";
    public static final String ORDER_COMPLETED_KEY = "bicap.order.completed.key";
    public static final String ORDER_CREATED_QUEUE = "bicap.order.created.queue";
    public static final String ORDER_CREATED_KEY = "bicap.order.created.key";
    public static final String ORDER_CONFIRMED_QUEUE = "bicap.order.confirmed.queue";
    public static final String ORDER_CONFIRMED_KEY = "bicap.order.confirmed.key";

    @Value("${bicap.farm.auth.queue:bicap.farm.auth.queue}")
    private String authQueue;

    // --- Auth Service Integration ---
    @Value("${bicap.auth.exchange:bicap.auth.exchange}")
    private String authExchangeName;

    @Value("${bicap.auth.routing_key:bicap.auth.routing.key}")
    private String authRoutingKey;

    @Bean
    public TopicExchange authExchange() {
        return new TopicExchange(authExchangeName);
    }

    @Bean
    public Queue tradingUserQueue() {
        return new Queue("bicap.trading.user.queue", true);
    }

    @Bean
    public Binding authBinding() {
        return BindingBuilder.bind(tradingUserQueue()).to(authExchange()).with(authRoutingKey);
    }

    @Bean
    public Queue tradingProductQueue() {
        return new Queue("bicap.trading.product.queue", true);
    }


    // --- Order Service Beans ---
    @Bean
    public TopicExchange orderExchange() {
        return new TopicExchange(ORDER_EXCHANGE);
    }

    @Bean
    public Queue orderCompletedQueue() {
        return new Queue(ORDER_COMPLETED_QUEUE, true);
    }

    @Bean
    public Queue orderCreatedQueue() {
        return new Queue(ORDER_CREATED_QUEUE, true);
    }

    @Bean
    public Queue orderConfirmedQueue() {
        return new Queue(ORDER_CONFIRMED_QUEUE, true);
    }

    @Bean
    public Binding orderCompletedBinding() {
        return BindingBuilder.bind(orderCompletedQueue()).to(orderExchange()).with(ORDER_COMPLETED_KEY);
    }

    @Bean
    public Binding orderCreatedBinding() {
        return BindingBuilder.bind(orderCreatedQueue()).to(orderExchange()).with(ORDER_CREATED_KEY);
    }

    @Bean
    public Binding orderConfirmedBinding() {
        return BindingBuilder.bind(orderConfirmedQueue()).to(orderExchange()).with(ORDER_CONFIRMED_KEY);
    }

    // --- Converter ---
    @Bean
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }
}