package com.bicap.shipping_manager_service.controller;

import com.bicap.shipping_manager_service.service.NotificationProducer;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationProducer notificationProducer;

    /**
     * API: Gửi notification thủ công
     * @param request Chứa recipientType, title, message, priority, relatedOrderId
     * @return Success message
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SHIPPINGMANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> sendNotification(@RequestBody Map<String, Object> request) {
        String recipientType = (String) request.get("recipientType");
        String title = (String) request.get("title");
        String message = (String) request.get("message");
        String priority = (String) request.getOrDefault("priority", "MEDIUM");
        
        Long relatedOrderId = null;
        if (request.get("relatedOrderId") != null) {
            relatedOrderId = Long.valueOf(request.get("relatedOrderId").toString());
        }

        // Validate
        if (recipientType == null || title == null || message == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "recipientType, title, and message are required");
            return ResponseEntity.badRequest().body(error);
        }

        // Validate recipientType
        if (!recipientType.equals("FARM_MANAGER") && 
            !recipientType.equals("RETAILER") && 
            !recipientType.equals("ALL")) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "recipientType must be FARM_MANAGER, RETAILER, or ALL");
            return ResponseEntity.badRequest().body(error);
        }

        // Send notification via RabbitMQ
        notificationProducer.sendManualNotification(recipientType, title, message, priority, relatedOrderId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Notification sent successfully");
        response.put("recipientType", recipientType);
        
        return ResponseEntity.ok(response);
    }
}
