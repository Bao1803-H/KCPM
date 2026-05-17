package com.bicap.shipping_manager_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ShipmentEvent {
    private Long orderId;
    private String status;
    private String message;
}