package com.bicap.trading_order_service.service;

import com.bicap.trading_order_service.dto.CreateFeedbackRequest;
import com.bicap.trading_order_service.entity.OrderFeedback;

public interface IFeedbackService {
    OrderFeedback createFeedback(CreateFeedbackRequest request);
}
