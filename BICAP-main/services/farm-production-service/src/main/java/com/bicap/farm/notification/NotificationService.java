package com.bicap.farm.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

/**
 * Service for sending notifications to farm-management-web via RabbitMQ
 * 
 * Example usage:
 * 
 * @Autowired
 * private NotificationService notificationService;
 * 
 * // Send success notification
 * notificationService.sendSuccess("Lô hàng mới", "Đã thêm lô hàng #LH001 thành công");
 * 
 * // Send warning
 * notificationService.sendWarning("Cảnh báo tồn kho", "Sản phẩm 'Rau cải' sắp hết (còn 5kg)");
 * 
 * // Send custom notification
 * notificationService.sendNotification("order", "farm.order.new", "Đơn hàng mới", "...");
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {
    
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;
    
    private static final String EXCHANGE = "notifications.exchange";
    
    /**
     * Send a success notification
     */
    public void sendSuccess(String title, String message) {
        sendNotification("success", "farm.success", title, message);
    }
    
    /**
     * Send an info notification
     */
    public void sendInfo(String title, String message) {
        sendNotification("info", "farm.info", title, message);
    }
    
    /**
     * Send a warning notification
     */
    public void sendWarning(String title, String message) {
        sendNotification("warning", "farm.warning", title, message);
    }
    
    /**
     * Send an error notification
     */
    public void sendError(String title, String message) {
        sendNotification("error", "farm.error", title, message);
    }
    
    /**
     * Send a custom notification
     * 
     * @param type Notification type (success, info, warning, error, order, shipping)
     * @param routingKey RabbitMQ routing key (e.g., "farm.batch.created")
     * @param title Notification title
     * @param message Notification message
     */
    public void sendNotification(String type, String routingKey, String title, String message) {
        try {
            NotificationDTO notification = NotificationDTO.builder()
                .type(type)
                .title(title)
                .message(message)
                .from("Farm Production Service")
                .build();
            
            rabbitTemplate.convertAndSend(EXCHANGE, routingKey, notification);
            log.info("Sent notification: {} - {}", title, routingKey);
            
        } catch (Exception e) {
            log.error("Failed to send notification: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Send notification for new export batch created
     */
    public void notifyBatchCreated(String batchCode, String productName) {
        sendSuccess(
            "Lô hàng mới",
            String.format("Đã tạo lô xuất hàng %s cho sản phẩm '%s'", batchCode, productName)
        );
    }
    
    /**
     * Send notification for low stock warning
     */
    public void notifyLowStock(String productName, double quantity, String unit) {
        sendWarning(
            "Cảnh báo tồn kho",
            String.format("Sản phẩm '%s' sắp hết hàng (còn %.2f %s)", productName, quantity, unit)
        );
    }
    
    /**
     * Send notification for batch ready to ship
     */
    public void notifyBatchReadyToShip(String batchCode) {
        sendInfo(
            "Sẵn sàng vận chuyển",
            String.format("Lô hàng %s đã sẵn sàng để vận chuyển", batchCode)
        );
    }
}
