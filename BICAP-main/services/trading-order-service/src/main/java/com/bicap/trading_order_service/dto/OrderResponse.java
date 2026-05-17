package com.bicap.trading_order_service.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.bicap.trading_order_service.entity.Order;

public class OrderResponse {

    private Long orderId;
    private BigDecimal totalAmount;
    private String status;
    private LocalDateTime createdAt;

    // Danh sách items
    private List<OrderItemResponse> items;

    /* ===== CONSTRUCTORS ===== */

    public OrderResponse(Long orderId,
                         BigDecimal totalAmount,
                         String status,
                         LocalDateTime createdAt) {
        this.orderId = orderId;
        this.totalAmount = totalAmount;
        this.status = status;
        this.createdAt = createdAt;
    }

    // Constructor với items
    public OrderResponse(Long orderId,
                         BigDecimal totalAmount,
                         String status,
                         LocalDateTime createdAt,
                         List<OrderItemResponse> items) {
        this.orderId = orderId;
        this.totalAmount = totalAmount;
        this.status = status;
        this.createdAt = createdAt;
        this.items = items;
    }

    /* ===== FACTORY METHOD ===== */

    public static OrderResponse fromEntity(Order order) {

        List<OrderItemResponse> items = order.getItems()
            .stream()
            .map(item -> new OrderItemResponse(
                    item.getProduct().getId(),
                    item.getProduct().getName(),
                    item.getQuantity(),
                    item.getUnitPrice()
            ))
            .toList();

        return new OrderResponse(
                order.getId(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getCreatedAt(),
                items
        );
    }

    /* ===== GETTERS ===== */

    public Long getOrderId() {
        return orderId;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public List<OrderItemResponse> getItems() {
        return items;
    }
}
