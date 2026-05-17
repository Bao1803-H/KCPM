package com.example.admin_service.controller;

import com.example.admin_service.client.FarmServiceClient;
import com.example.admin_service.dto.FarmResponseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/farms")
public class AdminFarmController {

    @Autowired
    private FarmServiceClient farmServiceClient;

    @GetMapping
    public ResponseEntity<List<FarmResponseDTO>> monitorFarms() {
        // Admin Service gọi sang Farm Service
        List<FarmResponseDTO> farms = farmServiceClient.getAllFarms();
        return ResponseEntity.ok(farms);
    }
}