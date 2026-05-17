package com.bicap.auth.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    
    @Value("${bicap.auth.queue.res:bicap.auth.response.queue}")
    private String responseQueue;

    @Value("${bicap.farm.auth.queue:bicap.farm.auth.queue}")
    private String farmAuthQueue;

    @Value("${bicap.auth.exchange:bicap.auth.exchange}")
    private String exchange;

    @Value("${bicap.auth.routing_key:bicap.auth.routing.key}")
    private String routingKey;

    @Bean
    public TopicExchange exchange() {
        return new TopicExchange(exchange);
    }

    @Bean
    public Queue responseQueue() {
        return new Queue(responseQueue);
    }

    @Bean
    public Queue farmAuthQueue() {
        return new Queue(farmAuthQueue);
    }

    @Bean   
    public Binding responseBinding() {
        return BindingBuilder.bind(responseQueue()).to(exchange()).with(routingKey);
    }

    @Bean   
    public Binding farmAuthBinding() {
        return BindingBuilder.bind(farmAuthQueue()).to(exchange()).with(routingKey);
    }
}
