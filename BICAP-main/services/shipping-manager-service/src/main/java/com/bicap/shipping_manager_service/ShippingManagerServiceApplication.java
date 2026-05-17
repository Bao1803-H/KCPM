package com.bicap.shipping_manager_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class ShippingManagerServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ShippingManagerServiceApplication.class, args);
	}
}