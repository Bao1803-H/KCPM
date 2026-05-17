package com.bicap.shipping_manager_service.listener;

import com.bicap.shipping_manager_service.event.OrderConfirmedEvent;
import com.bicap.shipping_manager_service.repository.ShipmentRepository;
import com.bicap.shipping_manager_service.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Listener for OrderConfirmedEvent from trading-order-service.
 * When farm manager confirms an order, create shipment only if one does not exist yet
 * (e.g. order came from /api/orders without payment flow; retailer orders create shipment on OrderCreated).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderConfirmedListener {

    private final ShipmentService shipmentService;
    private final ShipmentRepository shipmentRepository;

    @RabbitListener(queues = "bicap.order.confirmed.queue")
    public void handleOrderConfirmed(OrderConfirmedEvent event) {
        log.info("📦 [Shipping Manager] Received OrderConfirmedEvent: orderId={}, buyerEmail={}, status={}", 
                event.getOrderId(), event.getBuyerEmail(), event.getStatus());
        
        try {
            log.info("✅ Order {} confirmed - Buyer: {}, Total: {}, Address: {}", 
                    event.getOrderId(), 
                    event.getBuyerEmail(), 
                    event.getTotalAmount(),
                    event.getShippingAddress());
            
            if (shipmentRepository.findByOrderId(event.getOrderId()).isPresent()) {
                log.info("✅ Shipment already exists for orderId={}, skipping create", event.getOrderId());
                return;
            }
            
            shipmentService.createShipmentForOrder(
                    event.getOrderId(),
                    event.getShippingAddress(),
                    event.getBuyerEmail()
            );
            
            log.info("✅ Shipment created for confirmed orderId={}", event.getOrderId());
            
        } catch (Exception e) {
            log.error("❌ Error processing OrderConfirmedEvent for orderId={}: {}", 
                    event.getOrderId(), e.getMessage(), e);
        }
    }
}
