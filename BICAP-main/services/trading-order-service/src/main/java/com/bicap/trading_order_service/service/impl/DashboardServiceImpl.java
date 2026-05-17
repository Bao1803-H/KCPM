package com.bicap.trading_order_service.service.impl;

import com.bicap.trading_order_service.dto.DashboardStatsDTO;
import com.bicap.trading_order_service.exception.repository.CategoryRepository;
import com.bicap.trading_order_service.exception.repository.MarketplaceProductRepository;
import com.bicap.trading_order_service.exception.repository.OrderRepository;
import com.bicap.trading_order_service.service.IDashboardService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
public class DashboardServiceImpl implements IDashboardService {

    private final MarketplaceProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final CategoryRepository categoryRepository;

    public DashboardServiceImpl(MarketplaceProductRepository productRepository,
                                 OrderRepository orderRepository,
                                 CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    public DashboardStatsDTO getOverviewStats() {
        // Xác định khoảng thời gian hôm nay
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);

        // === THỐNG KÊ SẢN PHẨM ===
        long totalActiveProducts = productRepository.countByStatus("ACTIVE");
        long totalBannedProducts = productRepository.countByStatus("BANNED");
        long totalOutOfStockProducts = productRepository.countByStatus("OUT_OF_STOCK");
        long totalPendingProducts = productRepository.countByStatus("PENDING");
        long totalProducts = productRepository.count();

        // === THỐNG KÊ ĐƠN HÀNG HÔM NAY ===
        long totalOrdersToday = orderRepository.countByCreatedAtBetween(startOfDay, endOfDay);
        long ordersCreatedToday = orderRepository.countByStatusAndCreatedAtBetween("CREATED", startOfDay, endOfDay);
        long ordersConfirmedToday = orderRepository.countByStatusAndCreatedAtBetween("CONFIRMED", startOfDay, endOfDay);
        long ordersCompletedToday = orderRepository.countByStatusAndCreatedAtBetween("COMPLETED", startOfDay, endOfDay);
        long ordersRejectedToday = orderRepository.countByStatusAndCreatedAtBetween("REJECTED", startOfDay, endOfDay);

        // === THỐNG KÊ ĐƠN HÀNG TỔNG ===
        long totalOrders = orderRepository.count();
        long totalOrdersCompleted = orderRepository.countByStatus("COMPLETED");

        // === DOANH THU ===
        BigDecimal revenueToday = orderRepository.calculateRevenueByDateRange(startOfDay, endOfDay);
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue();
        BigDecimal estimatedPendingRevenue = orderRepository.calculateEstimatedPendingRevenue();

        // === THỐNG KÊ DANH MỤC ===
        long totalCategories = categoryRepository.count();
        long totalActiveCategories = categoryRepository.findByIsActiveTrue().size();

        return DashboardStatsDTO.builder()
                // Sản phẩm
                .totalActiveProducts(totalActiveProducts)
                .totalBannedProducts(totalBannedProducts)
                .totalOutOfStockProducts(totalOutOfStockProducts)
                .totalPendingProducts(totalPendingProducts)
                .totalProducts(totalProducts)
                // Đơn hàng hôm nay
                .totalOrdersToday(totalOrdersToday)
                .ordersCreatedToday(ordersCreatedToday)
                .ordersConfirmedToday(ordersConfirmedToday)
                .ordersCompletedToday(ordersCompletedToday)
                .ordersRejectedToday(ordersRejectedToday)
                // Đơn hàng tổng
                .totalOrders(totalOrders)
                .totalOrdersCompleted(totalOrdersCompleted)
                // Doanh thu
                .revenueToday(revenueToday != null ? revenueToday : BigDecimal.ZERO)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .estimatedPendingRevenue(estimatedPendingRevenue != null ? estimatedPendingRevenue : BigDecimal.ZERO)
                // Danh mục
                .totalCategories(totalCategories)
                .totalActiveCategories(totalActiveCategories)
                // Thời gian
                .statsDate(today)
                .build();
    }
}
