package com.example.admin_service.dto;

import com.example.admin_service.enums.UserStatus;
import lombok.Data;
import java.util.Set;

@Data
public class UserResponseDTO {
    private Long id;
    private String username;
    private String email;
    private UserStatus status;
    private Set<String> roles; // Chỉ trả về tên Role cho nhẹ
}