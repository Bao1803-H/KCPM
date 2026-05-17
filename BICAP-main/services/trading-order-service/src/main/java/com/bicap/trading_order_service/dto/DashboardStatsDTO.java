package com.bicap.trading_order_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDTO {

    // Thống kê sản phẩm
    private long totalActiveProducts;
    private long totalBannedProducts;
    private long totalOutOfStockProducts;
    private long totalPendingProducts;
    private long totalProducts;

    // Thống kê đơn hàng hôm nay
    private long totalOrdersToday;
    private long ordersCreatedToday;
    private long ordersConfirmedToday;
    private long ordersCompletedToday;
    private long ordersRejectedToday;

    // Thống kê đơn hàng tổng
    private long totalOrders;
    private long totalOrdersCompleted;

    // Doanh thu
    private BigDecimal revenueToday;
    private BigDecimal totalRevenue;
    private BigDecimal estimatedPendingRevenue;

    // Thống kê danh mục
    private long totalCategories;
    private long totalActiveCategories;

    // Thông tin thời gian
    private LocalDate statsDate;
}
