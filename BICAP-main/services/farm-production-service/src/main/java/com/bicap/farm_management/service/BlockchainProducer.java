package com.bicap.farm_management.service;

import com.bicap.farm_management.dto.BlockchainMessage;
import com.google.gson.Gson;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;

@Service
public class BlockchainProducer {
    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Value("${bicap.rabbitmq.exchange}")
    private String exchange;

    @Value("${bicap.rabbitmq.routing-key.request}")
    private String routingKey;

    // Hàm tính Hash SHA-256
    public String calculateHash(Object data) {
        try {
            String json = new Gson().toJson(data);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(json.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error calculating hash", e);
        }
    }

    // Hàm gửi tin nhắn đi
    public void sendToBlockchain(Long id, String type, Object dataObj) {
        String hash = calculateHash(dataObj);
        BlockchainMessage msg = new BlockchainMessage(
            String.valueOf(id), type, hash, LocalDateTime.now().toString()
        );
        rabbitTemplate.convertAndSend(exchange, routingKey, msg);
        System.out.println("🚀 [SENT] Sent to Blockchain: " + msg);
    }
}