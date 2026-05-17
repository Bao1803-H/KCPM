package com.bicap.shipping_manager_service.service;

import com.bicap.shipping_manager_service.repository.ShipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final ShipmentRepository shipmentRepository;
    private final RestTemplate restTemplate;
    
    @Value("${application.config.trading-order-service-url:http://localhost:8082}")
    private String tradingOrderServiceUrl;

    public List<Map<String, Object>> getConfirmedOrders(String userToken) {
        try {
            // Call Trading Order Service to get confirmed orders
            String url = tradingOrderServiceUrl + "/api/admin/orders/status/CONFIRMED";
            
            // Prepare headers with JWT token
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            if (userToken != null && !userToken.isEmpty()) {
                headers.set("Authorization", "Bearer " + userToken);
            }
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            // Try to get confirmed orders from trading-order-service
            ResponseEntity<List<Map<String, Object>>> response;
            try {
                response = restTemplate.exchange(
                    url, 
                    HttpMethod.GET, 
                    entity, 
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
                );
            } catch (org.springframework.web.client.HttpClientErrorException e) {
                // If 401/403, log and return empty list
                System.err.println("Error calling Trading Order Service: " + e.getStatusCode() + " - " + e.getMessage());
                if (e.getStatusCode().value() == 401 || e.getStatusCode().value() == 403) {
                    System.err.println("Trading Order Service requires authentication with ROLE_SHIPPINGMANAGER or ROLE_ADMIN.");
                    System.err.println("Current user may not have the required role.");
                }
                return new ArrayList<>();
            } catch (Exception e) {
                System.err.println("Unexpected error calling Trading Order Service: " + e.getMessage());
                e.printStackTrace();
                return new ArrayList<>();
            }
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> orders = response.getBody();
                
                if (orders == null || orders.isEmpty()) {
                    return new ArrayList<>();
                }
                
                // Get order IDs that already have shipments
                Set<Long> existingOrderIds = shipmentRepository.findAll().stream()
                    .map(s -> s.getOrderId())
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
                
                // Filter out orders that already have shipments and normalize the data
                // Note: Orders are already filtered to CONFIRMED status by the endpoint
                return orders.stream()
                    .filter(order -> {
                        Long orderId = getOrderId(order);
                        return orderId != null && !existingOrderIds.contains(orderId);
                    })
                    .map(this::normalizeOrderData)
                    .collect(Collectors.toList());
            }
            
            return new ArrayList<>();
        } catch (Exception e) {
            System.err.println("Error in getConfirmedOrders: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    private Map<String, Object> normalizeOrderData(Map<String, Object> order) {
        Map<String, Object> normalized = new HashMap<>(order);
        
        // Map OrderResponse fields from trading-order-service to expected format
        // OrderResponse has: orderId, totalAmount, status, createdAt, items
        // Map orderId to id for consistency
        if (normalized.containsKey("orderId") && !normalized.containsKey("id")) {
            normalized.put("id", normalized.get("orderId"));
        }
        
        // Extract product names from items list
        if (normalized.containsKey("items")) {
            Object itemsObj = normalized.get("items");
            if (itemsObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> items = (List<Map<String, Object>>) itemsObj;
                if (!items.isEmpty()) {
                    // Get first product name as primary product name
                    Map<String, Object> firstItem = items.get(0);
                    if (firstItem.containsKey("productName")) {
                        normalized.put("productName", firstItem.get("productName"));
                    }
                    // Store all items for reference
                    normalized.put("orderItems", items);
                }
            }
        }
        
        // Set default values if missing
        if (!normalized.containsKey("productName")) {
            normalized.put("productName", "Nông sản");
        }
        if (!normalized.containsKey("retailerName")) {
            // buyerEmail is available in OrderResponse, use it as retailer identifier
            normalized.put("retailerName", normalized.getOrDefault("buyerEmail", "N/A"));
        }
        
        return normalized;
    }
    
    private Long getOrderId(Map<String, Object> order) {
        // OrderResponse from trading-order-service uses "orderId" field
        Object id = order.get("orderId");
        if (id == null) {
            // Fallback to "id" field for compatibility
            id = order.get("id");
        }
        
        if (id instanceof Number) {
            return ((Number) id).longValue();
        } else if (id != null) {
            try {
                return Long.parseLong(id.toString());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}
