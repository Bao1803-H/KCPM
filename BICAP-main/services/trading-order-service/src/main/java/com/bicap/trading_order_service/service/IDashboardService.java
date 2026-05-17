package com.bicap.trading_order_service.service;

import com.bicap.trading_order_service.dto.DashboardStatsDTO;

public interface IDashboardService {

    /**
     * Lấy thống kê tổng quan cho Dashboard Admin
     * Bao gồm: tổng sản phẩm, đơn hàng hôm nay, doanh thu
     * @return DashboardStatsDTO
     */
    DashboardStatsDTO getOverviewStats();
}
