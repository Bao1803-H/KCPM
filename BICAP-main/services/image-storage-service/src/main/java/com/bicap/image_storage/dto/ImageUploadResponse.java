package com.bicap.image_storage.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImageUploadResponse {
    private Long imageId;
    private String fileName;
    private String originalName;
    private String imageUrl;
    private Long fileSize;
    private String contentType;
    private String message;
}
