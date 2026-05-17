package com.bicap.trading_order_service.service;

import com.bicap.trading_order_service.entity.FarmManager;
import com.bicap.trading_order_service.entity.MarketplaceProduct;
import com.bicap.trading_order_service.exception.repository.FarmManagerRepository;
import com.bicap.trading_order_service.exception.repository.MarketplaceProductRepository;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class TradingOrderEventListener {

    @Autowired
    private FarmManagerRepository farmManagerRepository;

    @Autowired
    private MarketplaceProductRepository productRepository;

    // 1. Listen for User Data from Auth Service
    @RabbitListener(queues = "${bicap.auth.response.queue}")
    public void receiveUserData(Map<String, Object> message) {
        System.out.println("📩 [TRADING] Received User Data: " + message);
        try {
            Long id = ((Number) message.get("id")).longValue();
            String username = (String) message.get("username");
            String email = (String) message.get("email");

            // Check if user exists to avoid duplicates
            FarmManager user = farmManagerRepository.findById(id).orElse(new FarmManager());
            
            user.setId(id);
            user.setFarmId(id);
            user.setUsername(username);
            user.setEmail(email);
            
            if (user.getRole() == null) user.setRole("ROLE_FARMMANAGER");

            farmManagerRepository.save(user);
            System.out.println("✅ [TRADING] Saved User: " + username);
        } catch (Exception e) {
            System.err.println("❌ Error saving user: " + e.getMessage());
        }
    }

    // 2. Listen for Product Data from Farm Production Service
    @RabbitListener(queues = "${bicap.farm.product.queue}")
    public void receiveProductData(Map<String, Object> message) {
        System.out.println("📩 [TRADING] Received Product Data: " + message);
        try {
            // Extract data from the map sent by MarketplaceProductServiceImpl
            Object farmIdObj = message.get("farmId");
            if (!(farmIdObj instanceof Number)) throw new IllegalAccessException("Missing farmId");
            Long farmId = ((Number) farmIdObj).longValue();

            FarmManager farmManager = farmManagerRepository.findByFarmId(farmId)
                .orElseThrow(() -> new RuntimeException("No FarmManager found from table in database"));

            String productName = (String) message.get("name");
            String description = (String) message.get("description");
            String unit = (String) message.get("unit");
            Double price = ((Number) message.get("price")).doubleValue();
            Integer quantity = ((Number) message.get("quantity")).intValue();
            String category = (String) message.get("category");
            String imageUrl = (String) message.get("imageUrl");
            String batchId = message.get("batchId") != null ? String.valueOf(message.get("batchId")) : null;

            // Upsert by batchId (image is often uploaded after product creation)
            MarketplaceProduct product = null;
            if (batchId != null && !batchId.isBlank()) {
                product = productRepository.findFirstByBatchId(batchId).orElse(null);
            }
            // Backward-compat: older records may have null batchId; try match by farm + name + PENDING
            if (product == null && productName != null) {
                MarketplaceProduct candidate = productRepository
                        .findFirstByFarmManager_FarmIdAndNameIgnoreCaseAndStatusOrderByCreatedAtDesc(farmId, productName, "PENDING")
                        .orElse(null);
                if (candidate != null && (candidate.getBatchId() == null || candidate.getBatchId().isBlank())) {
                    product = candidate;
                }
            }

            if (product == null) {
                product = new MarketplaceProduct();
                product.setFarmManager(farmManager);
                product.setStatus("PENDING"); // Default status on trading floor
                product.setCreatedAt(LocalDateTime.now());
            }

            // Update fields (do not reset status on updates)
            product.setName(productName);
            product.setDescription(description);
            product.setUnit(unit);
            product.setPrice(price != null ? price.doubleValue() : null);
            product.setQuantity(quantity != null ? quantity.intValue() : null);
            product.setCategory(category);
            product.setImageUrl(imageUrl);
            product.setBatchId(batchId);

            productRepository.save(product);
            System.out.println("✅ [TRADING] Upserted Product: " + productName + " | batchId=" + batchId);
        } catch (Exception e) {
            System.err.println("❌ Error saving product: " + e.getMessage());
        }
    }
}
