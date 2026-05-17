package com.bicap.farm_management.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.bicap.farm_management.entity.ExportBatch;

@Repository
public interface ExportBatchRepository extends JpaRepository<ExportBatch, Long> {
    // Tìm các đợt xuất hàng thuộc về một lô sản xuất cụ thể
    @Query("SELECT e FROM ExportBatch e WHERE e.productionBatch.id = :productionBatchId")
    List<ExportBatch> findByProductionBatchId(@Param("productionBatchId") Long productionBatchId);
    
    // Tìm các đợt xuất hàng thuộc về một farm cụ thể
    List<ExportBatch> findByFarmIdOrderByExportDateDesc(Long farmId);
}