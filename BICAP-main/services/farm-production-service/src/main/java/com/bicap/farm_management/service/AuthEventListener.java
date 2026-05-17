package com.bicap.farm_management.service;

import com.bicap.farm_management.entity.Farm;
import com.bicap.farm_management.repository.FarmRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class 
AuthEventListener {

    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @RabbitListener(queues = "${bicap.farm.auth.queue:bicap.farm.auth.queue}")
    public void receiveAuthMessage(Message message) {
        try {
            // Manually deserialize the message body to Map
            Map<String, Object> data = new ObjectMapper().readValue(message.getBody(), Map.class);
            System.out.println("📩 [FARM] Received Auth Message: " + data);

            // Extract data safely
            Long userId = ((Number) data.get("id")).longValue();
            String username = (String) data.get("username");
            String email = (String) data.get("email");

            Farm farm;
            // Check if farm already exists for this user to avoid duplicates
            Optional<Farm> existingFarm = farmRepository.findByOwnerId(userId);
            if (existingFarm.isPresent()) {
                System.out.println("⚠️ Farm already exists for user: " + username);
                farm = existingFarm.get();
            } else {
                // Create a default Farm for the new Farm Manager
                farm = new Farm();
                farm.setOwnerId(userId);
                farm.setFarmName(username + "'s Farm"); // Default name using username
                farm.setEmail(email); // Default address
                
                farm = farmRepository.save(farm);
                System.out.println("✅ [FARM] Created default farm for user: " + username);
            }

            // Send a message with the new farm details to Trading Service
            Map<String, Object> farmMessage = new HashMap<>();
            farmMessage.put("farmId", farm.getId());
            farmMessage.put("ownerId", farm.getOwnerId());
            rabbitTemplate.convertAndSend("bicap.farm.creation.queue", farmMessage);
            System.out.println("🚀 [FARM] Sent farm creation message to 'bicap.farm.creation.queue': " + farmMessage);

        } catch (Exception e) {
            System.err.println("❌ Error processing auth message: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
