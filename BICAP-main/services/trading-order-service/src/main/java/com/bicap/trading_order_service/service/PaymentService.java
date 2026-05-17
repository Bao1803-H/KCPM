package com.bicap.trading_order_service.service;

import com.bicap.trading_order_service.dto.OrderItemRequest;
import com.bicap.trading_order_service.entity.MarketplaceProduct;
import com.bicap.trading_order_service.exception.repository.MarketplaceProductRepository;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PaymentService {

    private final MarketplaceProductRepository productRepository;
    private final RestTemplate restTemplate;

    /* ================== MOMO SANDBOX CONFIG ================== */
    private static final String PARTNER_CODE = "MOMO";
    private static final String ACCESS_KEY = "F8BBA842ECF85";
    private static final String SECRET_KEY = "K951B6PE1waDMi640xX08PD3vg6EkVlz";

    private static final String ENDPOINT =
            "https://test-payment.momo.vn/v2/gateway/api/create";

    private static final String REDIRECT_URL =
            "http://localhost:3000/payment-success";

    private static final String IPN_URL =
            "http://localhost:8081/api/payments/momo/ipn";

    public PaymentService(MarketplaceProductRepository productRepository) {
        this.productRepository = productRepository;

        // ✅ timeout để tránh treo
        this.restTemplate = new RestTemplate();
    }

    /* =========================================================
       TẠO PAYMENT MOMO SANDBOX (QR + PAY URL)
    ========================================================= */
    public Map<String, Object> createMomoPayment(
            List<OrderItemRequest> items,
            String paymentToken
    ) {

        /* ================== 1️⃣ TÍNH TỔNG TIỀN TỪ DB ================== */
        long totalAmount = 0;

        for (OrderItemRequest item : items) {
            MarketplaceProduct product = productRepository
                    .findById(item.getProductId())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Product not found: " + item.getProductId()
                            )
                    );

            totalAmount += product.getPrice() * item.getQuantity();
        }

        if (totalAmount <= 0) {
            throw new RuntimeException("Total amount invalid");
        }

        /* ================== 2️⃣ MOMO PARAMS ================== */
        String orderId = PARTNER_CODE + System.currentTimeMillis();
        String requestId = orderId;
        String orderInfo = "Thanh toán đơn hàng BICAP";
        String requestType = "payWithMethod";
        String extraData = paymentToken;

        /* ================== 3️⃣ RAW SIGNATURE ================== */
        String rawSignature =
                "accessKey=" + ACCESS_KEY +
                "&amount=" + totalAmount +
                "&extraData=" + extraData +
                "&ipnUrl=" + IPN_URL +
                "&orderId=" + orderId +
                "&orderInfo=" + orderInfo +
                "&partnerCode=" + PARTNER_CODE +
                "&redirectUrl=" + REDIRECT_URL +
                "&requestId=" + requestId +
                "&requestType=" + requestType;

        String signature = hmacSHA256(rawSignature, SECRET_KEY);

        /* ================== 4️⃣ REQUEST BODY ================== */
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("partnerCode", PARTNER_CODE);
        requestBody.put("partnerName", "BICAP");
        requestBody.put("storeId", "BICAPStore");
        requestBody.put("requestId", requestId);
        requestBody.put("amount", totalAmount);
        requestBody.put("orderId", orderId);
        requestBody.put("orderInfo", orderInfo);
        requestBody.put("redirectUrl", REDIRECT_URL);
        requestBody.put("ipnUrl", IPN_URL);
        requestBody.put("requestType", requestType);
        requestBody.put("extraData", extraData);
        requestBody.put("lang", "vi");
        requestBody.put("autoCapture", true);
        requestBody.put("signature", signature);

        /* ================== 5️⃣ CALL MOMO ================== */
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                ENDPOINT,
                entity,
                Map.class
        );

        if (response.getStatusCode() != HttpStatus.OK
                || response.getBody() == null) {
            throw new RuntimeException("MoMo payment failed");
        }

        Map<String, Object> momoResponse = response.getBody();

        /* ================== 6️⃣ CHECK RESULT ================== */
        Object resultCodeObj = momoResponse.get("resultCode");
        int resultCode = Integer.parseInt(resultCodeObj.toString());

        if (resultCode != 0) {
            throw new RuntimeException(
                    "MoMo error: " + momoResponse.get("message")
            );
        }

        /* ================== 7️⃣ RETURN (KHÔNG NULL) ================== */
        Map<String, Object> result = new HashMap<>();
        result.put("amount", totalAmount);
        result.put("payUrl", momoResponse.get("payUrl"));
        result.put("qrCodeUrl", momoResponse.getOrDefault("qrCodeUrl", ""));
        result.put("deeplink", momoResponse.getOrDefault("deeplink", ""));

        return result;
    }

    /* ================== SIGNATURE ================== */
    private String hmacSHA256(String data, String key) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA256");
            hmac.init(
                    new SecretKeySpec(
                            key.getBytes(StandardCharsets.UTF_8),
                            "HmacSHA256"
                    )
            );

            byte[] rawHmac = hmac.doFinal(
                    data.getBytes(StandardCharsets.UTF_8)
            );

            StringBuilder sb = new StringBuilder();
            for (byte b : rawHmac) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();

        } catch (Exception e) {
            throw new RuntimeException("Cannot sign MoMo request", e);
        }
    }
}
