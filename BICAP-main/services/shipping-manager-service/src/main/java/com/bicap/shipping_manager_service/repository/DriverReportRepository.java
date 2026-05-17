package com.bicap.shipping_manager_service.repository;

import com.bicap.shipping_manager_service.entity.DriverReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DriverReportRepository extends JpaRepository<DriverReport, Long> {
    List<DriverReport> findByDriverId(Long driverId);
    List<DriverReport> findByShipmentId(Long shipmentId);
    List<DriverReport> findByStatus(String status);
}
