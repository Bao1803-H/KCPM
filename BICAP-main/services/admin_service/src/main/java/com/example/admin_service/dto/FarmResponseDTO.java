package com.example.admin_service.dto;

import lombok.Data;

@Data
public class FarmResponseDTO {
    private Long id;
    private String farmName;
    private String address;
    private String ownerName;
    // Thêm các trường khác tùy vào Farm Service của bạn
}