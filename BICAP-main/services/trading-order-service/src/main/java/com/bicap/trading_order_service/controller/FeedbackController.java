package com.bicap.trading_order_service.controller;

import com.bicap.trading_order_service.dto.CreateFeedbackRequest;
import com.bicap.trading_order_service.entity.OrderFeedback;
import com.bicap.trading_order_service.service.IFeedbackService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/order-feedbacks")
public class FeedbackController {

    private final IFeedbackService service;

    public FeedbackController(IFeedbackService service) {
        this.service = service;
    }

    /**
     * Retailer đánh giá đơn hàng (chỉ khi COMPLETED)
     */
    @PostMapping
    public OrderFeedback createFeedback(
            @Valid @RequestBody CreateFeedbackRequest request) {

        return service.createFeedback(request);
    }
}
