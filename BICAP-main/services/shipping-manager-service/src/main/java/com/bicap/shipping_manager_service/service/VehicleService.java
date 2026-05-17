package com.bicap.shipping_manager_service.service;

import com.bicap.shipping_manager_service.entity.Vehicle;
import com.bicap.shipping_manager_service.entity.ShipmentStatus;
import com.bicap.shipping_manager_service.repository.VehicleRepository;
import com.bicap.shipping_manager_service.repository.ShipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VehicleService {
    private final VehicleRepository vehicleRepository;
    private final ShipmentRepository shipmentRepository;

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    public Vehicle getVehicleById(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
    }

    public Vehicle createVehicle(Vehicle vehicle) {
        // Validate: Biển số xe không được để trống
        if (vehicle.getPlate() == null || vehicle.getPlate().trim().isEmpty()) {
            throw new IllegalArgumentException("Biển số xe không được để trống");
        }
        
        // Validate: Kiểm tra biển số xe không trùng với xe đã tồn tại
        String plate = vehicle.getPlate().trim().toUpperCase();
        vehicleRepository.findByPlateIgnoreCase(plate).ifPresent(existingVehicle -> {
            throw new IllegalArgumentException("Biển số này đã được dùng");
        });
        
        vehicle.setPlate(plate); // Normalize to uppercase
        if (vehicle.getStatus() == null) vehicle.setStatus("AVAILABLE");
        return vehicleRepository.save(vehicle);
    }

    @Transactional
    public Vehicle updateVehicle(Long id, Vehicle vehicle) {
        Vehicle existing = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
        
        // Update fields
        if (vehicle.getPlate() != null && !vehicle.getPlate().trim().isEmpty()) {
            String newPlate = vehicle.getPlate().trim().toUpperCase();
            // Kiểm tra nếu biển số mới khác biển số hiện tại và đã tồn tại
            if (!newPlate.equalsIgnoreCase(existing.getPlate())) {
                vehicleRepository.findByPlateIgnoreCase(newPlate).ifPresent(conflictVehicle -> {
                    throw new IllegalArgumentException("Biển số này đã được dùng");
                });
            }
            existing.setPlate(newPlate);
        }
        if (vehicle.getType() != null) {
            existing.setType(vehicle.getType());
        }
        if (vehicle.getStatus() != null) {
            existing.setStatus(vehicle.getStatus());
        }
        
        return vehicleRepository.save(existing);
    }

    @Transactional
    public void deleteVehicle(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
        
        // Check if vehicle is currently in use (has active shipments)
        boolean isInUse = shipmentRepository.findByVehicleId(id).stream()
                .anyMatch(shipment -> shipment.getStatus() != ShipmentStatus.DELIVERED 
                                   && shipment.getStatus() != ShipmentStatus.CANCELLED);
        
        if (isInUse) {
            throw new RuntimeException("Cannot delete vehicle that is currently assigned to an active shipment");
        }
        
        vehicleRepository.delete(vehicle);
    }
}
