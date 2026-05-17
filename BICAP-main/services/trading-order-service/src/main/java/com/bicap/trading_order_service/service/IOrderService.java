package com.bicap.trading_order_service.service;

import java.util.List;

import com.bicap.trading_order_service.dto.CreateOrderRequest;
import com.bicap.trading_order_service.dto.OrderResponse;

public interface IOrderService {

    OrderResponse createOrder(CreateOrderRequest request, String buyerEmail, Long buyerId);

    OrderResponse completeOrder(Long orderId);
    
    List<OrderResponse> getOrdersByFarm(Long farmId);

    OrderResponse confirmOrder(Long orderId);

    OrderResponse rejectOrder(Long orderId);

    List<OrderResponse> getOrdersByBuyerEmail(String buyerEmail);

    OrderResponse getOrderDetailByIdAndBuyerEmail(Long orderId, String buyerEmail);
}
