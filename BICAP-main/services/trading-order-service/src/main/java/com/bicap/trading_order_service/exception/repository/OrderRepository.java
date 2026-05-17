package com.bicap.trading_order_service.exception.repository;

import com.bicap.trading_order_service.entity.Order;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // ===============================
    // FARM MANAGER
    // ===============================
    @Query("""
        SELECT DISTINCT o FROM Order o 
        JOIN o.items i 
        JOIN i.product p 
        WHERE p.farmManager.farmId = :farmId
    """)
    List<Order> findOrdersByFarmId(@Param("farmId") Long farmId);

    // ===============================
    // BUYER (RETAILER)
    // ===============================
    @Query("""
        SELECT o FROM Order o
        WHERE o.buyerEmail = :buyerEmail
        ORDER BY o.createdAt DESC
    """)
    List<Order> findOrdersByBuyerEmail(@Param("buyerEmail") String buyerEmail);

    Optional<Order> findByIdAndBuyerEmail(Long id, String buyerEmail);

    // ===============================
    // STATISTICS / ADMIN
    // ===============================
    long countByStatus(String status);

    @Query("""
        SELECT COUNT(o) FROM Order o 
        WHERE o.createdAt >= :startDate 
          AND o.createdAt < :endDate
    """)
    long countByCreatedAtBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("""
        SELECT COUNT(o) FROM Order o 
        WHERE o.status = :status 
          AND o.createdAt >= :startDate 
          AND o.createdAt < :endDate
    """)
    long countByStatusAndCreatedAtBetween(
            @Param("status") String status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    // ===============================
    // REVENUE
    // ===============================
    @Query("""
        SELECT COALESCE(SUM(o.totalAmount), 0) 
        FROM Order o 
        WHERE o.status = 'COMPLETED'
    """)
    BigDecimal calculateTotalRevenue();

    @Query("""
        SELECT COALESCE(SUM(o.totalAmount), 0) 
        FROM Order o 
        WHERE o.status = 'COMPLETED'
          AND o.createdAt >= :startDate 
          AND o.createdAt < :endDate
    """)
    BigDecimal calculateRevenueByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("""
        SELECT COALESCE(SUM(o.totalAmount), 0) 
        FROM Order o 
        WHERE o.status IN ('CREATED', 'CONFIRMED')
    """)
    BigDecimal calculateEstimatedPendingRevenue();

    // ===============================
    // ORDER LIST
    // ===============================
    @Query("""
        SELECT o FROM Order o 
        WHERE o.createdAt >= :startDate 
          AND o.createdAt < :endDate 
        ORDER BY o.createdAt DESC
    """)
    List<Order> findOrdersToday(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    // ADMIN
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items i LEFT JOIN FETCH i.product ORDER BY o.createdAt DESC")
    List<Order> findAllOrdersForAdmin();

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items i LEFT JOIN FETCH i.product WHERE o.status = :status ORDER BY o.createdAt DESC")
    List<Order> findByStatusOrderByCreatedAtDesc(@Param("status") String status);
    
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items i LEFT JOIN FETCH i.product WHERE o.id = :id")
    java.util.Optional<Order> findByIdWithItems(@Param("id") Long id);
}
