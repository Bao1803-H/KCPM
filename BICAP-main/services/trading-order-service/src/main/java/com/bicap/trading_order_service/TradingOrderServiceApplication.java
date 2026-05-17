package com.bicap.trading_order_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableTransactionManagement
public class TradingOrderServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(TradingOrderServiceApplication.class, args);
    }
}
