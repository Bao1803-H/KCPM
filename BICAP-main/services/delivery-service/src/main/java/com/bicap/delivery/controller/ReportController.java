package com.bicap.delivery.controller;

import com.bicap.delivery.dto.ReportRequest;
import com.bicap.delivery.model.Report;
import com.bicap.delivery.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    // 6️⃣ Ship User (Driver) gửi report cho Shipping Manager
    @PostMapping
    public Report sendReport(@Valid @RequestBody ReportRequest request) {
        return reportService.sendReport(
                request.getShipmentId(),
                request.getUserId(),   // đổi sang userId
                request.getMessage()
        );
    }
}
