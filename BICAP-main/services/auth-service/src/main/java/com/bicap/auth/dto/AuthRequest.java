package com.bicap.auth.dto;

import lombok.Data;

@Data
public class AuthRequest {
    private String email;
    private String username;
    private String password;
    private String role;
    /** Client/role identifier: admin, retailer, farm, shippingManager, shippingDriver */
    private String clientId;
}
