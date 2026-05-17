package com.bicap.auth.dto;

import java.util.List;
import lombok.Data;

@Data   
public class UserProfileRequest {
    private Long id;
    private String address;
    private String avatarBase64;  // Or handle as needed
    private List<BusinessLicenseResponse> businessLicenses;

    @Data
    public static class BusinessLicenseResponse {
        private Long id;
        private String licensePath;
        private String originalName;
        private String data;
    }
}
