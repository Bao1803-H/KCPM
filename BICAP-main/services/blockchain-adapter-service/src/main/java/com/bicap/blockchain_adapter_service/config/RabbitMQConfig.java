package com.bicap.blockchain_adapter_service.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${bicap.rabbitmq.queue.request:farm_request_queue}")
    private String requestQueueName;

    @Value("${bicap.rabbitmq.queue.response:farm_response_queue}")
    private String responseQueueName;

    @Value("${bicap.rabbitmq.exchange:bicap_exchange}")
    private String exchangeName;

    @Value("${bicap.rabbitmq.routing-key.request:bicap_routing_key}")
    private String requestRoutingKey;

    @Value("${bicap.rabbitmq.routing-key.response:bicap_routing_key_response}")
    private String responseRoutingKey;

    @Bean
    public TopicExchange exchange() {
        return new TopicExchange(exchangeName);
    }

    @Bean
    public Queue requestQueue() {
        return new Queue(requestQueueName, true);
    }

    @Bean
    public Queue responseQueue() {
        return new Queue(responseQueueName, true);
    }

    @Bean
    public Binding requestBinding() {
        return BindingBuilder.bind(requestQueue()).to(exchange()).with(requestRoutingKey);
    }

    @Bean
    public Binding responseBinding() {
        return BindingBuilder.bind(responseQueue()).to(exchange()).with(responseRoutingKey);
    }

    @Bean
    public MessageConverter jsonMessageConverter() { 
        return new Jackson2JsonMessageConverter(); 
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}