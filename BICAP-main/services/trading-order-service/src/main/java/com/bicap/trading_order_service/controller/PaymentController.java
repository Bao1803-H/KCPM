package com.bicap.trading_order_service.controller;

import com.bicap.trading_order_service.dto.CreateOrderRequest;
import com.bicap.trading_order_service.dto.OrderResponse;
import com.bicap.trading_order_service.security.JwtUser;
import com.bicap.trading_order_service.service.OrderService;
import com.bicap.trading_order_service.service.PaymentService;
import com.bicap.trading_order_service.service.PaymentStorage;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentStorage paymentStorage;
    private final PaymentService paymentService;
    private final OrderService orderService;

    public PaymentController(
            PaymentStorage paymentStorage,
            PaymentService paymentService,
            OrderService orderService
    ) {
        this.paymentStorage = paymentStorage;
        this.paymentService = paymentService;
        this.orderService = orderService;
    }

    /**
     * 1️⃣ TẠO PAYMENT + QR MOMO SANDBOX
     * ❌ CHƯA TẠO ORDER
     */
    @PostMapping("/momo")
    public ResponseEntity<?> createPayment(
            @RequestBody CreateOrderRequest request
    ) {
        // ===============================
        // ✅ TẠO TOKEN TẠM
        // ===============================
        String paymentToken = UUID.randomUUID().toString();

        // ===============================
        // ✅ GỌI MOMO SANDBOX (TÍNH TIỀN TRONG SERVICE)
        // ===============================
        Map<String, Object> momoRes =
                paymentService.createMomoPayment(
                        request.getItems(),
                        paymentToken
                );

        // ===============================
        // ✅ LƯU REQUEST TẠM (CHƯA TẠO ORDER)
        // ===============================
        paymentStorage.save(paymentToken, request);

        return ResponseEntity.ok(Map.of(
                "paymentToken", paymentToken,
                "amount", momoRes.get("amount"),
                "qrCodeUrl", momoRes.get("qrCodeUrl"),
                "payUrl", momoRes.get("payUrl")
        ));
    }

    /**
     * 2️⃣ MOMO SUCCESS → TẠO ORDER
     */
    @GetMapping("/momo/success/{paymentToken}")
    public ResponseEntity<?> paymentSuccess(
            @PathVariable String paymentToken,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        CreateOrderRequest request =
                paymentStorage.get(paymentToken);

        if (request == null) {
            return ResponseEntity.badRequest()
                    .body("Payment expired or invalid");
        }

        JwtUser jwtUser = (JwtUser) authentication.getPrincipal();
        Long buyerId = jwtUser.getUserId();
        if (buyerId == null) {
            return ResponseEntity.badRequest()
                    .body("User ID missing in token. Re-login and try again.");
        }
        String buyerEmail = jwtUser.getEmail() != null ? jwtUser.getEmail() : jwtUser.getUsername();

        // ✅ TẠO ORDER SAU KHI THANH TOÁN THÀNH CÔNG
        OrderResponse created = orderService.createOrder(
                request,
                buyerEmail,
                buyerId
        );

        // ✅ XOÁ PAYMENT TẠM
        paymentStorage.remove(paymentToken);

        return ResponseEntity.ok(created);
    }
}
