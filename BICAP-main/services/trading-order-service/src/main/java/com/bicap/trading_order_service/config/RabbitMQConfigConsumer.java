package com.bicap.trading_order_service.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfigConsumer {

    @Value("${bicap.farm.product.queue:bicap.farm.product.queue}")
    private String productQueue;

    @Value("${bicap.farm.product.exchange:bicap.product.exchange}")
    private String productExchange;

    @Value("${bicap.farm.product.routing_key:product.routing_key}")
    private String routingKey;

    @Value("${bicap.auth.response.queue:bicap.auth.response.queue}")
    private String authResponseQueue;

    @Bean
    public Queue productQueue() {
        return new Queue(productQueue, true);
    }

    @Bean
    public Queue authQueue() {
        return new Queue(authResponseQueue, true);
    }

    @Bean 
    public TopicExchange topicExchange() {
        return new TopicExchange(productExchange); 
    }

    @Bean
    public Binding productBinding(Queue productQueue, TopicExchange topicExchange) {
        return BindingBuilder.bind(productQueue()).to(topicExchange()).with(routingKey);
    }
}
