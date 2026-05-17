package com.bicap.image_storage.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImageResponse {
    private Long imageId;
    private Long productId;
    private Long farmId;
    private String fileName;
    private String originalName;
    private String imageUrl;
    private Long fileSize;
    private String contentType;
    private String status;
    private Long uploadedBy;
    private LocalDateTime createdAt;
}
