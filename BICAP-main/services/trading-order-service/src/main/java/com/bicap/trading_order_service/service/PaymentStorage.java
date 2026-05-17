package com.bicap.trading_order_service.service;

import com.bicap.trading_order_service.dto.CreateOrderRequest;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class PaymentStorage {

    // 🔹 Lưu request tạm
    private final Map<String, CreateOrderRequest> storage =
            new ConcurrentHashMap<>();

    // 🔹 Lưu thời gian tạo token
    private final Map<String, Long> createdAt =
            new ConcurrentHashMap<>();

    // ⏱️ TTL = 10 phút
    private static final long EXPIRE_TIME = 10 * 60 * 1000;

    /**
     * Lưu payment tạm
     */
    public void save(String token, CreateOrderRequest request) {
        storage.put(token, request);
        createdAt.put(token, System.currentTimeMillis());
    }

    /**
     * Lấy payment (tự check hết hạn)
     */
    public CreateOrderRequest get(String token) {
        Long time = createdAt.get(token);
        if (time == null) return null;

        // ⛔ Hết hạn
        if (System.currentTimeMillis() - time > EXPIRE_TIME) {
            remove(token);
            return null;
        }

        return storage.get(token);
    }

    /**
     * Xoá payment
     */
    public void remove(String token) {
        storage.remove(token);
        createdAt.remove(token);
    }
}
