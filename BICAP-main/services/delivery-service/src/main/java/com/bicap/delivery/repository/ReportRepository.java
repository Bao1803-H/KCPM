package com.bicap.delivery.repository;

import com.bicap.delivery.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByUserId(Long userId);

    List<Report> findByShipmentId(Long shipmentId);
}
