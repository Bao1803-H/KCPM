package com.bicap.shipping_manager_service.entity;

public enum ShipmentStatus {
    PENDING,    // Chờ xử lý
    ASSIGNED,   // Đã gán xe
    IN_TRANSIT, // Đang vận chuyển
    DELIVERED,  // Đã giao hàng
    CANCELLED   // Đã hủy
}