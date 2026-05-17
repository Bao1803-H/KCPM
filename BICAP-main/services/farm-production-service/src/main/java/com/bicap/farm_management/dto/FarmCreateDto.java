package com.bicap.farm_management.dto;

import lombok.Data;

@Data
public class FarmCreateDto {
    private Long ownerId;
    private String farmName;
    private String address;
    private String email;
    private String hotline;
    private Double areaSize;
    private String description;
    private String createAt;

}