package com.bicap.farm_management.config;

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

@Configuration
public class RabbitMQConfig {

    @Value("${bicap.farm.creation.queue:bicap.farm.creation.queue}")
    private String farmCreationQueue;

    @Value("${bicap.farm.creation.exchange:bicap.farm.exchange}")
    private String farmCreationExchange;

    @Value("${bicap.farm.creation.routing_key:farm.creation.routing_key}")
    private String farmCreationRoutingKey;

    @Value("${bicap.farm.auth.queue:bicap.farm.auth.queue}")
    private String authQueueName;

    @Value("${bicap.rabbitmq.queue.response:farm_response_queue}")
    private String responseQueue;

    @Value("${bicap.rabbitmq.exchange:bicap_exchange}")
    private String blockchainExchange;

    @Value("${bicap.rabbitmq.routing-key.request:bicap_routing_key}")
    private String blockchainRequestRoutingKey;

    @Value("${bicap.rabbitmq.routing-key.response:bicap_routing_key_response}")
    private String blockchainResponseRoutingKey;

    @Bean
    public Queue authQueue() {
        // Create a durable queue
        return new Queue(authQueueName, true);
    }

    @Bean
    public Queue farmCreationQueue() {
        return new Queue(farmCreationQueue, true);
    }

    @Bean
    public Queue responseQueue() {
        return new Queue(responseQueue, true);
    }

    @Bean
    public TopicExchange farmCreationExchange() {
        return new TopicExchange(farmCreationExchange);
    }

    @Bean
    public TopicExchange blockchainExchange() {
        return new TopicExchange(blockchainExchange);
    }

    @Bean
    public Binding farmCreationBinding() {
        return BindingBuilder.bind(farmCreationQueue()).to(farmCreationExchange()).with(farmCreationRoutingKey);
    }

    @Bean
    public Binding blockchainResponseBinding() {
        return BindingBuilder.bind(responseQueue()).to(blockchainExchange()).with(blockchainResponseRoutingKey);
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
