package com.bicap.farm_management.repository;

import com.bicap.farm_management.entity.EnvironmentMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EnvironmentMetricRepository extends JpaRepository<EnvironmentMetric, Long> {
    // Hàm tìm kiếm lịch sử chỉ số của một lô sản xuất
    // (Spring Data JPA tự động tạo câu lệnh SQL dựa trên tên hàm này)
    List<EnvironmentMetric> findByProductionBatchId(Long batchId);
}