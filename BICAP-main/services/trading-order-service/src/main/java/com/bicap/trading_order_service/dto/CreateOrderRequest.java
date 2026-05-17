package com.bicap.trading_order_service.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public class CreateOrderRequest {

    @NotNull
    private List<OrderItemRequest> items;
    
    @NotNull
    private String shippingAddress;

    public List<OrderItemRequest> getItems() {
        return items;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress){
        this.shippingAddress = shippingAddress;
    }

    public void setItems(List<OrderItemRequest> items) {
        this.items = items;
    }
}
