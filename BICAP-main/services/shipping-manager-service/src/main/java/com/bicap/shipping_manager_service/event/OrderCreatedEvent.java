package com.bicap.shipping_manager_service.event;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
public class OrderCreatedEvent implements Serializable {

    private Long orderId;
    private String buyerEmail;
    private String shippingAddress;
    private BigDecimal totalAmount;
    private String status;

    public OrderCreatedEvent() {
    }

    public OrderCreatedEvent(Long orderId, String buyerEmail, String shippingAddress, BigDecimal totalAmount, String status) {
        this.orderId = orderId;
        this.buyerEmail = buyerEmail;
        this.shippingAddress = shippingAddress;
        this.totalAmount = totalAmount;
        this.status = status;
    }
}
