package com.bicap.farm_management.repository;

import com.bicap.farm_management.entity.FarmingProcess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FarmingProcessRepository extends JpaRepository<FarmingProcess, Long> {
    // Lấy danh sách nhật ký của 1 lô sản xuất
    List<FarmingProcess> findByProductionBatchId(Long batchId);
}