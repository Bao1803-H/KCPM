package com.bicap.trading_order_service.service;

import com.bicap.trading_order_service.dto.OrderResponse;
import com.bicap.trading_order_service.dto.OrderStatisticsDTO;

import java.util.List;

public interface IAdminOrderService {

    /**
     * Lấy tất cả đơn hàng (dành cho Admin)
     */
    List<OrderResponse> getAllOrders();

    /**
     * Lấy đơn hàng theo ID
     */
    OrderResponse getOrderById(Long orderId);

    /**
     * Lấy đơn hàng theo trạng thái
     */
    List<OrderResponse> getOrdersByStatus(String status);

    /**
     * Đếm tổng số đơn hàng
     */
    Long countTotalOrders();

    /**
     * Đếm số đơn hàng theo trạng thái
     */
    Long countOrdersByStatus(String status);

    /**
     * Lấy thống kê đơn hàng
     */
    OrderStatisticsDTO getOrderStatistics();
}
