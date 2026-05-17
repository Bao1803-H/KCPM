package com.bicap.shipping_manager_service.controller;

import com.bicap.shipping_manager_service.entity.Vehicle;
import com.bicap.shipping_manager_service.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<Vehicle> getVehicleById(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getVehicleById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<?> createVehicle(@RequestBody Vehicle vehicle) {
        try {
            System.out.println("📝 [DEBUG] Creating vehicle - Plate: " + vehicle.getPlate() + 
                             ", Type: " + vehicle.getType() + 
                             ", Status: " + vehicle.getStatus());
            return ResponseEntity.ok(vehicleService.createVehicle(vehicle));
        } catch (IllegalArgumentException e) {
            System.out.println("❌ [ERROR] Validation error: " + e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(400).body(errorResponse);
        } catch (Exception e) {
            System.out.println("❌ [ERROR] Unexpected error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Lỗi khi tạo xe: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<?> updateVehicle(@PathVariable Long id, @RequestBody Vehicle vehicle) {
        try {
            return ResponseEntity.ok(vehicleService.updateVehicle(id, vehicle));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi khi cập nhật xe: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id) {
        vehicleService.deleteVehicle(id);
        return ResponseEntity.noContent().build();
    }
}