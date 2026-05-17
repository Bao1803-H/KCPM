package com.bicap.shipping_manager_service.repository;

import com.bicap.shipping_manager_service.entity.AdminReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AdminReportRepository extends JpaRepository<AdminReport, Long> {
    List<AdminReport> findByReporterId(Long reporterId);
    List<AdminReport> findByStatus(String status);
    List<AdminReport> findByPriority(String priority);
}
