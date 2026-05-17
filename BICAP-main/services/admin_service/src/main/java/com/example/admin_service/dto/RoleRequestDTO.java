package com.example.admin_service.dto;

import lombok.Data;

@Data
public class RoleRequestDTO {
    private String requestedRole; // FARM_OWNER, SHIPPER
    private String documentUrls;  // Link ảnh giấy phép
}