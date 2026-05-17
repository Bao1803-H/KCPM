package com.bicap.trading_order_service.exception.repository;

import com.bicap.trading_order_service.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    long countByProductId(Long productId);

    List<OrderItem> findByOrderId(Long orderId);
}
