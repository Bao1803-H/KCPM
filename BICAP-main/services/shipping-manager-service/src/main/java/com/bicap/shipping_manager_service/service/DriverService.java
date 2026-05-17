package com.bicap.shipping_manager_service.service;

import com.bicap.shipping_manager_service.entity.Driver;
import com.bicap.shipping_manager_service.entity.ShipmentStatus;
import com.bicap.shipping_manager_service.repository.DriverRepository;
import com.bicap.shipping_manager_service.repository.ShipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverService {
    private final DriverRepository driverRepository;
    private final ShipmentRepository shipmentRepository;

    public List<Driver> getAllDrivers() {
        return driverRepository.findAll();
    }

    public Driver getDriverById(Long id) {
        return driverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Driver not found with id: " + id));
    }

    public Driver createDriver(Driver driver) {
        // Validate: Hồ sơ hoàn chỉnh - kiểm tra tất cả các field bắt buộc
        if (driver.getName() == null || driver.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Họ tên tài xế không được để trống");
        }
        if (driver.getPhone() == null || driver.getPhone().trim().isEmpty()) {
            throw new IllegalArgumentException("Số điện thoại không được để trống");
        }
        if (driver.getLicense() == null || driver.getLicense().trim().isEmpty()) {
            throw new IllegalArgumentException("Giấy phép lái xe không được để trống");
        }
        if (driver.getCitizenId() == null || driver.getCitizenId().trim().isEmpty()) {
            throw new IllegalArgumentException("Số căn cước công dân không được để trống");
        }
        if (driver.getEmail() == null || driver.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email không được để trống");
        }
        
        // Validate: Giấy phép lái xe không được trùng
        String license = driver.getLicense().trim().toUpperCase();
        driverRepository.findByLicenseIgnoreCase(license).ifPresent(existingDriver -> {
            throw new IllegalArgumentException("Giấy phép lái xe " + license + " đã được sử dụng bởi tài xế khác");
        });
        
        // Validate: Số căn cước công dân không được trùng
        String citizenId = driver.getCitizenId().trim();
        driverRepository.findByCitizenIdIgnoreCase(citizenId).ifPresent(existingDriver -> {
            throw new IllegalArgumentException("Số căn cước công dân " + citizenId + " đã được sử dụng bởi tài xế khác");
        });
        
        // Validate: Email không được trùng
        String email = driver.getEmail().trim().toLowerCase();
        driverRepository.findByEmailIgnoreCase(email).ifPresent(existingDriver -> {
            throw new IllegalArgumentException("Email " + email + " đã được sử dụng bởi tài xế khác");
        });
        
        driver.setLicense(license);
        driver.setCitizenId(citizenId);
        driver.setEmail(email);
        return driverRepository.save(driver);
    }
    
    public List<Driver> searchDriversByName(String name) {
        return driverRepository.findByNameContainingIgnoreCase(name);
    }

    @Transactional
    public Driver updateDriver(Long id, Driver driver) {
        Driver existing = driverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Driver not found with id: " + id));
        
        // Update fields - validate không được để trống
        if (driver.getName() != null && !driver.getName().trim().isEmpty()) {
            existing.setName(driver.getName().trim());
        } else if (driver.getName() != null && driver.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Họ tên tài xế không được để trống");
        }
        
        if (driver.getPhone() != null && !driver.getPhone().trim().isEmpty()) {
            existing.setPhone(driver.getPhone().trim());
        } else if (driver.getPhone() != null && driver.getPhone().trim().isEmpty()) {
            throw new IllegalArgumentException("Số điện thoại không được để trống");
        }
        
        // Validate: Giấy phép lái xe không được trùng (nếu thay đổi)
        if (driver.getLicense() != null && !driver.getLicense().trim().isEmpty()) {
            String newLicense = driver.getLicense().trim().toUpperCase();
            if (existing.getLicense() == null || !newLicense.equalsIgnoreCase(existing.getLicense())) {
                driverRepository.findByLicenseIgnoreCase(newLicense).ifPresent(conflictDriver -> {
                    if (!conflictDriver.getId().equals(id)) {
                        throw new IllegalArgumentException("Giấy phép lái xe " + newLicense + " đã được sử dụng bởi tài xế khác");
                    }
                });
            }
            existing.setLicense(newLicense);
        } else if (driver.getLicense() != null && driver.getLicense().trim().isEmpty()) {
            throw new IllegalArgumentException("Giấy phép lái xe không được để trống");
        }
        
        // Validate: Số căn cước công dân không được trùng (nếu thay đổi)
        if (driver.getCitizenId() != null && !driver.getCitizenId().trim().isEmpty()) {
            String newCitizenId = driver.getCitizenId().trim();
            if (existing.getCitizenId() == null || !newCitizenId.equalsIgnoreCase(existing.getCitizenId())) {
                driverRepository.findByCitizenIdIgnoreCase(newCitizenId).ifPresent(conflictDriver -> {
                    if (!conflictDriver.getId().equals(id)) {
                        throw new IllegalArgumentException("Số căn cước công dân " + newCitizenId + " đã được sử dụng bởi tài xế khác");
                    }
                });
            }
            existing.setCitizenId(newCitizenId);
        }
        
        // Validate: Email không được trùng (nếu thay đổi)
        if (driver.getEmail() != null && !driver.getEmail().trim().isEmpty()) {
            String newEmail = driver.getEmail().trim().toLowerCase();
            if (existing.getEmail() == null || !newEmail.equalsIgnoreCase(existing.getEmail())) {
                driverRepository.findByEmailIgnoreCase(newEmail).ifPresent(conflictDriver -> {
                    if (!conflictDriver.getId().equals(id)) {
                        throw new IllegalArgumentException("Email " + newEmail + " đã được sử dụng bởi tài xế khác");
                    }
                });
            }
            existing.setEmail(newEmail);
        }
        
        if (driver.getUserId() != null) {
            existing.setUserId(driver.getUserId());
        }
        
        return driverRepository.save(existing);
    }

    @Transactional
    public void deleteDriver(Long id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Driver not found with id: " + id));
        
        // Check if driver is currently assigned to active shipments
        boolean isInUse = shipmentRepository.findByDriverId(id).stream()
                .anyMatch(shipment -> shipment.getStatus() != ShipmentStatus.DELIVERED 
                                   && shipment.getStatus() != ShipmentStatus.CANCELLED);
        
        if (isInUse) {
            throw new RuntimeException("Cannot delete driver that is currently assigned to an active shipment");
        }
        
        driverRepository.delete(driver);
    }
}
