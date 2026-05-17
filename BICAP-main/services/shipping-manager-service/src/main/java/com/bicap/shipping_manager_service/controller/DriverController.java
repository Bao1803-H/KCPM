package com.bicap.shipping_manager_service.controller;

import com.bicap.shipping_manager_service.entity.Driver;
import com.bicap.shipping_manager_service.service.DriverService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DriverController {

    private final DriverService driverService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<List<Driver>> getAllDrivers() {
        return ResponseEntity.ok(driverService.getAllDrivers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<Driver> getDriverById(@PathVariable Long id) {
        return ResponseEntity.ok(driverService.getDriverById(id));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<List<Driver>> searchDrivers(@RequestParam String name) {
        return ResponseEntity.ok(driverService.searchDriversByName(name));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<?> createDriver(@RequestBody Driver driver) {
        try {
            System.out.println("📝 [DEBUG] Creating driver - Name: " + driver.getName() + 
                             ", Phone: " + driver.getPhone() + 
                             ", License: " + driver.getLicense() + 
                             ", CitizenId: " + driver.getCitizenId());
            return ResponseEntity.ok(driverService.createDriver(driver));
        } catch (IllegalArgumentException e) {
            System.out.println("❌ [ERROR] Validation error: " + e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(400).body(errorResponse);
        } catch (Exception e) {
            System.out.println("❌ [ERROR] Unexpected error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Lỗi khi tạo tài xế: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<?> updateDriver(@PathVariable Long id, @RequestBody Driver driver) {
        try {
            return ResponseEntity.ok(driverService.updateDriver(id, driver));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi khi cập nhật tài xế: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<Void> deleteDriver(@PathVariable Long id) {
        driverService.deleteDriver(id);
        return ResponseEntity.noContent().build();
    }
}