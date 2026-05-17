package com.bicap.trading_order_service.exception.repository;

import com.bicap.trading_order_service.entity.FarmManager;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FarmManagerRepository extends JpaRepository<FarmManager, Long> {

    Optional<FarmManager> findByFarmId(Long farmId);
}