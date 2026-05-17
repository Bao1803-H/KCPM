package com.bicap.shipping_manager_service.client;

import com.bicap.shipping_manager_service.dto.OrderResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "farm-production-service", url = "${application.config.farm-service-url}")
public interface FarmServiceClient {
    @GetMapping("/api/trading/order/{orderId}")
    OrderResponse getOrderDetails(@PathVariable("orderId") Long orderId);
}