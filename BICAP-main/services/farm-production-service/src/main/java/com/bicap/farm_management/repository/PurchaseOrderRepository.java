package com.bicap.farm_management.repository;

import com.bicap.farm_management.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    // Tìm đơn hàng theo bài đăng
    List<PurchaseOrder> findByProductListingId(Long listingId);
}