package com.bicap.delivery.service;

import com.bicap.delivery.model.Report;

public interface ReportService {

    Report sendReport(Long shipmentId, Long userId, String message);
}
