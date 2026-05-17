package com.bicap.shipping_manager_service.service;

import com.bicap.shipping_manager_service.entity.*;
import com.bicap.shipping_manager_service.repository.*;
import com.bicap.shipping_manager_service.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final ShipmentProducer shipmentProducer;

    public List<Shipment> getAllShipments() {
        return shipmentRepository.findAll();
    }

    public Shipment createShipment(Long orderId, String from, String to) {
        Shipment shipment = new Shipment();
        shipment.setOrderId(orderId);
        shipment.setFromLocation(from);
        shipment.setToLocation(to);
        shipment.setStatus(ShipmentStatus.PENDING);
        return shipmentRepository.save(shipment);
    }

    /**
     * Create shipment for a confirmed order (called by OrderConfirmedListener)
     * @param orderId The order ID from trading-order-service
     * @param shippingAddress The shipping address (to location)
     * @param buyerEmail The buyer's email
     * @return Created shipment
     */
    @Transactional
    public Shipment createShipmentForOrder(Long orderId, String shippingAddress, String buyerEmail) {
        // Check if shipment already exists for this order
        shipmentRepository.findByOrderId(orderId).ifPresent(existing -> {
            throw new RuntimeException("Shipment already exists for orderId: " + orderId);
        });

        Shipment shipment = new Shipment();
        shipment.setOrderId(orderId);
        // Set from location as warehouse/farm (you can customize this)
        shipment.setFromLocation("Warehouse");
        shipment.setToLocation(shippingAddress);
        shipment.setStatus(ShipmentStatus.PENDING);
        
        Shipment savedShipment = shipmentRepository.save(shipment);
        
        // Publish shipment status update via RabbitMQ
        shipmentProducer.sendShipmentStatusUpdate(orderId, "PENDING");
        
        return savedShipment;
    }

    @Transactional
    public Shipment assignDriverAndVehicle(Long shipmentId, Long driverId, Long vehicleId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));
        
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));
        
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        shipment.setDriver(driver);
        shipment.setVehicle(vehicle);
        shipment.setStatus(ShipmentStatus.ASSIGNED);
        
        // Cập nhật trạng thái xe thành bận
        vehicle.setStatus("BUSY");
        vehicleRepository.save(vehicle);

        return shipmentRepository.save(shipment);
    }

    public Shipment updateStatus(Long id, ShipmentStatus status) {
        Shipment shipment = shipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));
        shipment.setStatus(status);
        
        // Nếu giao xong hoặc hủy, trả xe về trạng thái sẵn sàng
        if (status == ShipmentStatus.DELIVERED || status == ShipmentStatus.CANCELLED) {
            if (shipment.getVehicle() != null) {
                Vehicle v = shipment.getVehicle();
                v.setStatus("AVAILABLE");
                vehicleRepository.save(v);
            }
        }
        
        return shipmentRepository.save(shipment);
    }

    public List<Shipment> getMyShipments() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) principal;
            Long userId = userDetails.getId();
            String email = userDetails.getEmail();
            
            // Tìm Driver theo userId từ Auth Service
            java.util.Optional<Driver> driverOpt = driverRepository.findByUserId(userId);
            
            // Nếu không tìm thấy theo userId, thử tìm theo email và auto-link
            if (driverOpt.isEmpty() && email != null && !email.isEmpty()) {
                driverOpt = driverRepository.findByEmailIgnoreCase(email);
                if (driverOpt.isPresent()) {
                    // Auto-link driver với userId
                    Driver driver = driverOpt.get();
                    driver.setUserId(userId);
                    driverRepository.save(driver);
                }
            }
            
            return driverOpt
                    .map(driver -> shipmentRepository.findByDriverId(driver.getId()))
                    .orElse(List.of());
        }
        return List.of();
    }

    @Transactional
    public void cancelShipment(Long id) {
        Shipment shipment = shipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shipment not found with id: " + id));
        
        // Check if shipment can be cancelled
        if (shipment.getStatus() == ShipmentStatus.DELIVERED) {
            throw new RuntimeException("Cannot cancel a shipment that has already been delivered");
        }
        
        if (shipment.getStatus() == ShipmentStatus.CANCELLED) {
            throw new RuntimeException("Shipment is already cancelled");
        }
        
        // Update status to cancelled
        shipment.setStatus(ShipmentStatus.CANCELLED);
        
        // Free up vehicle if assigned
        if (shipment.getVehicle() != null) {
            Vehicle vehicle = shipment.getVehicle();
            vehicle.setStatus("AVAILABLE");
            vehicleRepository.save(vehicle);
        }
        
        shipmentRepository.save(shipment);
        
        // Send notification via RabbitMQ
        if (shipment.getOrderId() != null) {
            shipmentProducer.sendShipmentStatusUpdate(shipment.getOrderId(), "CANCELLED");
        }
    }
}
