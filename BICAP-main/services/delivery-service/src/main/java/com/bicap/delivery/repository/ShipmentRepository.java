package com.bicap.delivery.repository;

import com.bicap.delivery.model.Shipment;
import com.bicap.delivery.model.ShipmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

    Optional<Shipment> findByShipmentCode(String shipmentCode);

    List<Shipment> findByUserId(Long userId);

    List<Shipment> findByUserIdAndStatus(Long userId, ShipmentStatus status);
}
