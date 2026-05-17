package com.bicap.shipping_manager_service.controller;

import com.bicap.shipping_manager_service.entity.Shipment;
import com.bicap.shipping_manager_service.entity.ShipmentStatus;
import com.bicap.shipping_manager_service.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Cho phép frontend truy cập
public class ShipmentController {

    private final ShipmentService shipmentService;

    // API: Lấy danh sách tất cả vận đơn (Admin/Manager)
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<List<Shipment>> getAllShipments() {
        return ResponseEntity.ok(shipmentService.getAllShipments());
    }

    // API: Tạo vận đơn mới
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<Shipment> createShipment(@RequestBody Shipment shipment) {
        return ResponseEntity.ok(shipmentService.createShipment(
                shipment.getOrderId(),
                shipment.getFromLocation(),
                shipment.getToLocation()
        ));
    }

    // API: Điều phối xe và tài xế
    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<Shipment> assignDriverAndVehicle(
            @PathVariable Long id,
            @RequestParam Long driverId,
            @RequestParam Long vehicleId) {
        return ResponseEntity.ok(shipmentService.assignDriverAndVehicle(id, driverId, vehicleId));
    }

    // API: Cập nhật trạng thái vận đơn
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_DELIVERYDRIVER', 'ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<Shipment> updateStatus(@PathVariable Long id, @RequestParam ShipmentStatus status) {
        return ResponseEntity.ok(shipmentService.updateStatus(id, status));
    }

    // API: Lấy danh sách đơn hàng của tài xế đang đăng nhập (Mobile App)
    @GetMapping("/my-shipments")
    @PreAuthorize("hasAuthority('ROLE_DELIVERYDRIVER')")
    public ResponseEntity<List<Shipment>> getMyShipments() {
        return ResponseEntity.ok(shipmentService.getMyShipments());
    }

    // API: Hủy vận đơn
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<Void> cancelShipment(@PathVariable Long id) {
        shipmentService.cancelShipment(id);
        return ResponseEntity.noContent().build();
    }
}