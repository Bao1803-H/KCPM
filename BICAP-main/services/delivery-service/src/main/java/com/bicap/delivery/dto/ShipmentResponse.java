package com.bicap.delivery.dto;

import com.bicap.delivery.model.Shipment;
import com.bicap.delivery.model.ShipmentStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ShipmentResponse {

    private Long id;
    private String shipmentCode;
    private Long orderId;
    private Long userId;
    private ShipmentStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ShipmentResponse fromEntity(Shipment shipment) {
        ShipmentResponse dto = new ShipmentResponse();
        dto.setId(shipment.getId());
        dto.setShipmentCode(shipment.getShipmentCode());
        dto.setOrderId(shipment.getOrderId());
        dto.setUserId(shipment.getUserId());
        dto.setStatus(shipment.getStatus());
        dto.setCreatedAt(shipment.getCreatedAt());
        dto.setUpdatedAt(shipment.getUpdatedAt());
        return dto;
    }
}
