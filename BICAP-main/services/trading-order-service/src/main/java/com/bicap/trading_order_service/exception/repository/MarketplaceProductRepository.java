package com.bicap.trading_order_service.exception.repository;

import com.bicap.trading_order_service.entity.MarketplaceProduct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarketplaceProductRepository
        extends JpaRepository<MarketplaceProduct, Long>,
                JpaSpecificationExecutor<MarketplaceProduct> {

    // Lấy product theo ID với FarmManager (tránh LazyInitializationException)
    @Query("SELECT p FROM MarketplaceProduct p LEFT JOIN FETCH p.farmManager WHERE p.id = :id")
    Optional<MarketplaceProduct> findByIdWithFarmManager(@Param("id") Long id);

    // ===============================
    // FARM MANAGER
    // ===============================
    @Query("SELECT p FROM MarketplaceProduct p WHERE p.farmManager.farmId = :farmId")
    List<MarketplaceProduct> findByFarmId(@Param("farmId") Long farmId);

    Optional<MarketplaceProduct> findFirstByBatchId(String batchId);

    Optional<MarketplaceProduct> findFirstByFarmManager_FarmIdAndNameIgnoreCaseAndStatusOrderByCreatedAtDesc(
            Long farmId,
            String name,
            String status
    );

    // ===============================
    // COMMON
    // ===============================
    List<MarketplaceProduct> findByStatus(String status);

    @Query("SELECT p FROM MarketplaceProduct p " +
           "WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<MarketplaceProduct> findByNameContainingIgnoreCase(
            @Param("keyword") String keyword);

    long countByStatus(String status);

    // ===============================
    // ADMIN – FILTER + PAGING
    // ===============================
    @Query(value = "SELECT p FROM MarketplaceProduct p LEFT JOIN FETCH p.farmManager fm " +
           "WHERE (:keyword IS NULL OR :keyword = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:status IS NULL OR :status = '' OR p.status = :status) " +
           "AND (:farmId IS NULL OR fm.farmId = :farmId)",
           countQuery = "SELECT COUNT(p) FROM MarketplaceProduct p LEFT JOIN p.farmManager fm " +
           "WHERE (:keyword IS NULL OR :keyword = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:status IS NULL OR :status = '' OR p.status = :status) " +
           "AND (:farmId IS NULL OR fm.farmId = :farmId)")
    Page<MarketplaceProduct> findWithFilters(
            @Param("keyword") String keyword,
            @Param("status") String status,
            @Param("farmId") Long farmId,
            Pageable pageable
    );
}
