package com.bicap.farm_management.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bicap.farm_management.entity.FarmingProcess;
import com.bicap.farm_management.service.FarmingProcessService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/farming-processes")
@CrossOrigin(origins = "*")
public class FarmingProcessController {
    @Autowired
    private FarmingProcessService processService;

    // Use hasAuthority instead of hasRole to match SecurityConfig
    @PreAuthorize("hasAuthority('ROLE_FARMMANAGER')")
    @PostMapping("/batch/{batchId}")
    public ResponseEntity<?> addProcess(@PathVariable Long batchId, @RequestBody FarmingProcess process, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User ID not found.");
        }
        return ResponseEntity.ok(processService.addProcess(batchId, process, userId));
    }

    // Use hasAnyAuthority instead of hasAnyRole to match SecurityConfig
    @PreAuthorize("hasAnyAuthority('ROLE_FARMMANAGER', 'ROLE_ADMIN', 'ROLE_RETAILER')") // Cho phép các vai trò xem tiến trình
    @GetMapping("/batch/{batchId}")
    public List<FarmingProcess> getHistory(@PathVariable Long batchId) {
        return processService.getProcessesByBatch(batchId);
    }
}