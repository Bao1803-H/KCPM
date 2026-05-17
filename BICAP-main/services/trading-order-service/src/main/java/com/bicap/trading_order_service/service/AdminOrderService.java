package com.bicap.trading_order_service.service;

import com.bicap.trading_order_service.dto.OrderResponse;
import com.bicap.trading_order_service.dto.OrderStatisticsDTO;
import com.bicap.trading_order_service.entity.Order;
import com.bicap.trading_order_service.exception.repository.OrderRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminOrderService implements IAdminOrderService {

    private final OrderRepository orderRepository;

    public AdminOrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Override
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAllOrdersForAdmin()
                .stream()
                .map(OrderResponse::fromEntity)
                .toList();
    }

    @Override
    public OrderResponse getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
        return OrderResponse.fromEntity(order);
    }

    @Override
    public List<OrderResponse> getOrdersByStatus(String status) {
        return orderRepository.findByStatusOrderByCreatedAtDesc(status)
                .stream()
                .map(OrderResponse::fromEntity)
                .toList();
    }

    @Override
    public Long countTotalOrders() {
        return orderRepository.count();
    }

    @Override
    public Long countOrdersByStatus(String status) {
        return orderRepository.countByStatus(status);
    }

    @Override
    public OrderStatisticsDTO getOrderStatistics() {
        Long totalOrders = orderRepository.count();
        Long createdOrders = orderRepository.countByStatus("CREATED");
        Long confirmedOrders = orderRepository.countByStatus("CONFIRMED");
        Long completedOrders = orderRepository.countByStatus("COMPLETED");
        Long rejectedOrders = orderRepository.countByStatus("REJECTED");

        return new OrderStatisticsDTO(
                totalOrders,
                createdOrders,
                confirmedOrders,
                completedOrders,
                rejectedOrders
        );
    }
}
