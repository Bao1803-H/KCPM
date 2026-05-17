package com.bicap.trading_order_service.event;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
public class OrderCompletedEvent implements Serializable {

    private Long orderId;

    // Use buyerEmail instead of buyerId
    private String buyerEmail;

    private BigDecimal totalAmount;

    public OrderCompletedEvent() {
    }

    public OrderCompletedEvent(Long orderId, String buyerEmail, BigDecimal totalAmount) {
        this.orderId = orderId;
        this.buyerEmail = buyerEmail;
        this.totalAmount = totalAmount;
    }
}
