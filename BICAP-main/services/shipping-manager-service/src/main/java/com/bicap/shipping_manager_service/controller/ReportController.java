package com.bicap.shipping_manager_service.controller;

import com.bicap.shipping_manager_service.entity.AdminReport;
import com.bicap.shipping_manager_service.entity.DriverReport;
import com.bicap.shipping_manager_service.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getSummaryReport() {
        return ResponseEntity.ok(reportService.getSummaryReport());
    }

    // View reports from a specific driver
    @GetMapping("/drivers/{driverId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<List<DriverReport>> getDriverReports(@PathVariable Long driverId) {
        return ResponseEntity.ok(reportService.getDriverReports(driverId));
    }

    // View all driver reports
    @GetMapping("/drivers")
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<List<DriverReport>> getAllDriverReports() {
        return ResponseEntity.ok(reportService.getAllDriverReports());
    }

    // View pending driver reports
    @GetMapping("/drivers/pending")
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<List<DriverReport>> getPendingDriverReports() {
        return ResponseEntity.ok(reportService.getPendingDriverReports());
    }

    // Send report to admin
    @PostMapping("/admin")
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<AdminReport> sendReportToAdmin(@RequestBody AdminReport report) {
        return ResponseEntity.ok(reportService.sendReportToAdmin(report));
    }

    // Get all admin reports sent by current shipping manager
    @GetMapping("/admin/my-reports")
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<List<AdminReport>> getMyAdminReports() {
        return ResponseEntity.ok(reportService.getMyAdminReports());
    }

    // Get all admin reports (for admin role)
    @GetMapping("/admin")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<AdminReport>> getAllAdminReports() {
        return ResponseEntity.ok(reportService.getAllAdminReports());
    }
}