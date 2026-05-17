package com.bicap.delivery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReportRequest {

    @NotNull
    private Long shipmentId;

    @NotNull
    private Long userId;

    @NotBlank
    private String message;
}
