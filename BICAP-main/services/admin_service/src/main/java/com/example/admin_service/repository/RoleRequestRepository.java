package com.example.admin_service.repository;

import com.example.admin_service.entity.RoleRequest;
import com.example.admin_service.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoleRequestRepository extends JpaRepository<RoleRequest, Long> {
    // Tìm tất cả đơn đang chờ duyệt để Admin xem
    List<RoleRequest> findByStatus(RequestStatus status);

    // Tìm đơn của 1 user cụ thể (để User xem lại lịch sử nộp)
    List<RoleRequest> findByUserId(Long userId);
}