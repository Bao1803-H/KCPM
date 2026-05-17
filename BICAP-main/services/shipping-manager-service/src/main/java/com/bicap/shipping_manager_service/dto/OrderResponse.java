package com.bicap.shipping_manager_service.dto;

import lombok.Data;

@Data
public class OrderResponse {
    private Long id;
    private Long retailerId;
    private Double quantity;
    private Double totalPrice;
    private String status;
}