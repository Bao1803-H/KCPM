package com.bicap.delivery.messaging;

import com.bicap.delivery.event.OrderCreatedEvent;
import com.bicap.delivery.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderCreatedConsumer {

    private final ShipmentService shipmentService;

    @RabbitListener(queues = "order.created.queue")
    public void handleOrderCreated(OrderCreatedEvent event) {
        log.info("📦 Received OrderCreatedEvent: {}", event);

        shipmentService.createShipment(event.getOrderId());

        log.info("✅ Shipment created for orderId={}", event.getOrderId());
    }
}
