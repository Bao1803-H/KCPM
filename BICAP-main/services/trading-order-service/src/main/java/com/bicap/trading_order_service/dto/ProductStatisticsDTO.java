package com.bicap.trading_order_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductStatisticsDTO {
    private long totalProducts;
    private long totalActive;       // APPROVED
    private long totalPending;
    private long totalBanned;
    private long totalOutOfStock;
}
