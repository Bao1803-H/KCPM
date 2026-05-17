package com.bicap.shipping_manager_service.repository;

import com.bicap.shipping_manager_service.entity.Shipment;
import com.bicap.shipping_manager_service.entity.ShipmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    List<Shipment> findByDriverId(Long driverId);
    List<Shipment> findByVehicleId(Long vehicleId);
    List<Shipment> findByStatus(ShipmentStatus status);
    java.util.Optional<Shipment> findByOrderId(Long orderId);
}
