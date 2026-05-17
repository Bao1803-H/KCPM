package com.bicap.delivery.service;

import com.bicap.delivery.model.Shipment;
import com.bicap.delivery.model.ShipmentStatus;
import com.bicap.delivery.repository.ShipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;

    // RabbitMQ sẽ gọi hàm này
    public Shipment createShipment(Long orderId) {
        Shipment shipment = new Shipment();
        shipment.setOrderId(orderId);
        shipment.setShipmentCode(generateShipmentCode());
        return shipmentRepository.save(shipment);
    }

    // 1️⃣ User (driver) xem danh sách shipment của mình
    public List<Shipment> getShipmentsByUser(Long userId) {
        return shipmentRepository.findByUserId(userId);
    }

    // 2️⃣ Xem chi tiết shipment
    public Shipment getShipmentDetail(Long shipmentId) {
        return shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));
    }

    // 3️⃣ Scan QR Code
    public Shipment getShipmentByQRCode(String shipmentCode) {
        return shipmentRepository.findByShipmentCode(shipmentCode)
                .orElseThrow(() -> new RuntimeException("Shipment not found by QR code"));
    }

    // 4️⃣ Confirm pickup
    public Shipment confirmPickup(Long shipmentId) {
        Shipment shipment = getShipmentDetail(shipmentId);
        shipment.setStatus(ShipmentStatus.PICKED_UP);
        return shipmentRepository.save(shipment);
    }

    // 5️⃣ Confirm delivery
    public Shipment confirmDelivery(Long shipmentId) {
        Shipment shipment = getShipmentDetail(shipmentId);
        shipment.setStatus(ShipmentStatus.DELIVERED);
        return shipmentRepository.save(shipment);
    }

    private String generateShipmentCode() {
        return "SHIP-" + UUID.randomUUID()
                .toString()
                .substring(0, 8)
                .toUpperCase();
    }
}
