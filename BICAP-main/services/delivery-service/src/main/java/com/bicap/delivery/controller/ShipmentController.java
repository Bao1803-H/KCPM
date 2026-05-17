package com.bicap.delivery.controller;

import com.bicap.delivery.dto.ShipmentResponse;
import com.bicap.delivery.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipments")
@RequiredArgsConstructor
public class ShipmentController {

    private final ShipmentService shipmentService;

    // 1️⃣ User (Ship Driver) xem danh sách shipment của mình
    @GetMapping("/user/{userId}")
    public List<ShipmentResponse> getShipmentsByUser(@PathVariable Long userId) {
        return shipmentService.getShipmentsByUser(userId)
                .stream()
                .map(ShipmentResponse::fromEntity)
                .toList();
    }

    // 2️⃣ Xem chi tiết shipment
    @GetMapping("/{shipmentId}")
    public ShipmentResponse getShipmentDetail(@PathVariable Long shipmentId) {
        return ShipmentResponse.fromEntity(
                shipmentService.getShipmentDetail(shipmentId)
        );
    }

    // 3️⃣ Scan QR Code
    @GetMapping("/scan/{shipmentCode}")
    public ShipmentResponse scanQRCode(@PathVariable String shipmentCode) {
        return ShipmentResponse.fromEntity(
                shipmentService.getShipmentByQRCode(shipmentCode)
        );
    }

    // 4️⃣ Confirm pickup từ farm
    @PostMapping("/{shipmentId}/pickup")
    public ShipmentResponse confirmPickup(@PathVariable Long shipmentId) {
        return ShipmentResponse.fromEntity(
                shipmentService.confirmPickup(shipmentId)
        );
    }

    // 5️⃣ Confirm giao hàng cho retailer
    @PostMapping("/{shipmentId}/deliver")
    public ShipmentResponse confirmDelivery(@PathVariable Long shipmentId) {
        return ShipmentResponse.fromEntity(
                shipmentService.confirmDelivery(shipmentId)
        );
    }
}
