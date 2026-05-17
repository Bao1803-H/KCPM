package com.bicap.trading_order_service.config;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    @Bean
    public Queue farmCreationQueue() {
        return new Queue("bicap.farm.creation.queue", true);
    }
}
