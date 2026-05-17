package com.bicap.delivery.service.impl;

import com.bicap.delivery.model.Report;
import com.bicap.delivery.repository.ReportRepository;
import com.bicap.delivery.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;

    @Override
    public Report sendReport(Long shipmentId, Long userId, String message) {
        Report report = new Report();
        report.setShipmentId(shipmentId);
        report.setUserId(userId);
        report.setMessage(message);
        return reportRepository.save(report);
    }
}
