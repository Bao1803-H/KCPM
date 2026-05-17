package com.example.admin_service.dto;

import com.example.admin_service.enums.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleRequestResponseDTO {
    private Long requestId;
    private Long userId;
    private String userName;
    private String email;
    private String requestedRoleName;
    private RequestStatus status;
    private String documentUrls;
    private String adminNote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
