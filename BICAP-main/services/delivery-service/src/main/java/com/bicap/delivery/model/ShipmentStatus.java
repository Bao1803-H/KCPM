package com.bicap.delivery.model;

public enum ShipmentStatus {
    CREATED,
    ASSIGNED,
    PICKED_UP,        // đã nhận hàng từ farm
    IN_TRANSIT,
    DELIVERED,        // đã giao cho retailer
    COMPLETED,
    CANCELLED
}
