package com.bicap.blockchain_adapter_service.repository;

import com.bicap.blockchain_adapter_service.entity.TraceLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TraceLogRepository
        extends JpaRepository<TraceLog, Long> {
}
