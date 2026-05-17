package com.bicap.shipping_manager_service.listener;

import com.bicap.shipping_manager_service.event.OrderCreatedEvent;
import com.bicap.shipping_manager_service.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Listener for OrderCreatedEvent from trading-order-service.
 * Triggered when retailer clicks "Thanh toán" and payment succeeds (order created).
 * Creates a PENDING shipment so shipping manager can assign driver/vehicle.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderCreatedListener {

    private final ShipmentService shipmentService;

    @RabbitListener(queues = "bicap.order.created.queue")
    public void handleOrderCreated(OrderCreatedEvent event) {
        log.info("📦 [Shipping Manager] Received OrderCreatedEvent: orderId={}, buyerEmail={}, status={}", 
                event.getOrderId(), event.getBuyerEmail(), event.getStatus());
        
        try {
            log.info("✅ Order {} created (retailer paid) - Buyer: {}, Total: {}, Address: {}", 
                    event.getOrderId(), 
                    event.getBuyerEmail(), 
                    event.getTotalAmount(),
                    event.getShippingAddress());
            
            shipmentService.createShipmentForOrder(
                    event.getOrderId(),
                    event.getShippingAddress(),
                    event.getBuyerEmail()
            );
            
            log.info("✅ Shipment created for orderId={} (from Thanh toán)", event.getOrderId());
            
        } catch (Exception e) {
            log.error("❌ Error processing OrderCreatedEvent for orderId={}: {}", 
                    event.getOrderId(), e.getMessage(), e);
        }
    }
}
