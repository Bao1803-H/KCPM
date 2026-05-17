package com.bicap.delivery.event;

import lombok.Data;

@Data
public class OrderCreatedEvent {
    private Long orderId;
    private Long userId;
    private Double totalAmount;
}
