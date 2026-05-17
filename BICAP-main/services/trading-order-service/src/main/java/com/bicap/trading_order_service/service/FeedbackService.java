package com.bicap.trading_order_service.service;

import com.bicap.trading_order_service.dto.CreateFeedbackRequest;
import com.bicap.trading_order_service.entity.Order;
import com.bicap.trading_order_service.entity.OrderFeedback;
import com.bicap.trading_order_service.exception.repository.OrderFeedbackRepository;
import com.bicap.trading_order_service.exception.repository.OrderRepository;

import org.springframework.stereotype.Service;

@Service
public class FeedbackService implements IFeedbackService {

    private final OrderRepository orderRepository;
    private final OrderFeedbackRepository feedbackRepository;

    public FeedbackService(OrderRepository orderRepository,
                           OrderFeedbackRepository feedbackRepository) {
        this.orderRepository = orderRepository;
        this.feedbackRepository = feedbackRepository;
    }

    @Override
    public OrderFeedback createFeedback(CreateFeedbackRequest request) {

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!"COMPLETED".equals(order.getStatus())) {
            throw new RuntimeException("Only COMPLETED orders can be reviewed");
        }

        OrderFeedback feedback = new OrderFeedback();
        feedback.setOrderId(order.getId());
        feedback.setRating(request.getRating());
        feedback.setComment(request.getComment());

        return feedbackRepository.save(feedback);
    }
}
