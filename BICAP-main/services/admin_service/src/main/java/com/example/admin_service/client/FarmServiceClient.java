package com.example.admin_service.client;

import com.example.admin_service.dto.FarmResponseDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Map;

@FeignClient(name = "farm-service", url = "${farm.service.url:http://localhost:8081}")
public interface FarmServiceClient {

    @GetMapping("/api/farm-features")
    List<FarmResponseDTO> getAllFarms();
    
    //Lấy số lượng farm
    @GetMapping("/api/farm-features/count")
    Long countTotalFarms();

    //Lấy log (Bạn cần tạo FarmLogDTO bên Admin Service để hứng dữ liệu)
    @GetMapping("/api/farm-features/{farmId}/logs")
    List<Object> getFarmLogs(@PathVariable("farmId") Long farmId);
    
    // Tạo farm mới cho owner khi duyệt role FARM_MANAGER
    @PostMapping("/api/farm-features/create-for-owner")
    Object createFarmForOwner(@RequestBody Map<String, Long> request);
}