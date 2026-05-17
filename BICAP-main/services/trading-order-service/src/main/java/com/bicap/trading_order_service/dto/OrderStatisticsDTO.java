package com.bicap.trading_order_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatisticsDTO {
    private Long totalOrders;
    private Long createdOrders;
    private Long confirmedOrders;
    private Long completedOrders;
    private Long rejectedOrders;
}
