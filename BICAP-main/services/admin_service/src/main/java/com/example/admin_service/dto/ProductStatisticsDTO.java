package com.example.admin_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductStatisticsDTO {
    private Long totalActive;
    private Long totalBanned;
    private Long totalOutOfStock;
    private Long totalPending;
}
