package com.example.admin_service.entity;
import com.example.admin_service.enums.RequestStatus;
import jakarta.persistence.*;
        import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "role_requests")
@Data // Lombok getter/setter
public class RoleRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long requestId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "requested_role_name", nullable = false)
    private String requestedRoleName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private RequestStatus status = RequestStatus.PENDING;

    @Column(name = "document_urls", columnDefinition = "TEXT")
    private String documentUrls; // Lưu link ảnh (cách nhau bởi dấu phẩy nếu nhiều ảnh)

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}