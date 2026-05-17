package com.bicap.shipping_manager_service.service;

import com.bicap.shipping_manager_service.entity.*;
import com.bicap.shipping_manager_service.repository.*;
import com.bicap.shipping_manager_service.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {
    private final ShipmentRepository shipmentRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverReportRepository driverReportRepository;
    private final AdminReportRepository adminReportRepository;

    public Map<String, Object> getSummaryReport() {
        Map<String, Object> report = new HashMap<>();
        report.put("totalShipments", shipmentRepository.count());
        report.put("totalDrivers", driverRepository.count());
        report.put("totalVehicles", vehicleRepository.count());
        report.put("pendingShipments", shipmentRepository.findByStatus(ShipmentStatus.PENDING).size());
        return report;
    }

    // View reports from a specific driver
    public List<DriverReport> getDriverReports(Long driverId) {
        return driverReportRepository.findByDriverId(driverId);
    }

    // View all driver reports
    public List<DriverReport> getAllDriverReports() {
        return driverReportRepository.findAll();
    }

    // View pending driver reports
    public List<DriverReport> getPendingDriverReports() {
        return driverReportRepository.findByStatus("PENDING");
    }

    // Send report to admin
    @Transactional
    public AdminReport sendReportToAdmin(AdminReport report) {
        // Get current user ID from security context
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetailsImpl) {
            Long userId = ((UserDetailsImpl) principal).getId();
            report.setReporterId(userId);
            report.setReporterRole("ROLE_SHIPPINGMANAGER");
        }
        
        return adminReportRepository.save(report);
    }

    // Get all admin reports sent by current shipping manager
    public List<AdminReport> getMyAdminReports() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetailsImpl) {
            Long userId = ((UserDetailsImpl) principal).getId();
            return adminReportRepository.findByReporterId(userId);
        }
        return List.of();
    }

    // Get all admin reports (for admin role)
    public List<AdminReport> getAllAdminReports() {
        return adminReportRepository.findAll();
    }
}
