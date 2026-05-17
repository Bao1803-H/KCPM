package com.bicap.trading_order_service.controller;

import com.bicap.trading_order_service.dto.CreateOrderRequest;
import com.bicap.trading_order_service.dto.OrderResponse;
import com.bicap.trading_order_service.security.JwtUser;
import com.bicap.trading_order_service.service.IOrderService;
import com.bicap.trading_order_service.service.OrderService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final IOrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // =======================
    // TEST JWT
    // =======================
    @GetMapping("/me")
    public ResponseEntity<?> me() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("Unauthenticated");
        }

        return ResponseEntity.ok(
                new JwtTestResponse(
                        authentication.getName(),
                        authentication.getAuthorities()
                                .stream()
                                .map(GrantedAuthority::getAuthority)
                                .collect(Collectors.toList())
                )
        );
    }

    // =======================
    // CREATE ORDER
    // =======================
    @PreAuthorize("hasAuthority('ROLE_RETAILER')")
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @RequestBody CreateOrderRequest request,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        com.bicap.trading_order_service.security.JwtUser jwtUser =
                (com.bicap.trading_order_service.security.JwtUser) authentication.getPrincipal();
        String buyerEmail = jwtUser.getEmail() != null ? jwtUser.getEmail() : jwtUser.getUsername();
        Long buyerId = jwtUser.getUserId();
        if (buyerId == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(
                orderService.createOrder(request, buyerEmail, buyerId)
        );
    }

    // =======================
    // FARM MANAGER
    // =======================
    @PreAuthorize("hasAuthority('ROLE_FARMMANAGER')")
    @GetMapping("/by-farm/{farmId}")
    public List<OrderResponse> getOrdersByFarm(
            @PathVariable Long farmId
    ) {
        return orderService.getOrdersByFarm(farmId);
    }

    @PreAuthorize("hasAuthority('ROLE_FARMMANAGER')")
    @PutMapping("/{orderId}/confirm")
    public OrderResponse confirmOrder(
            @PathVariable Long orderId
    ) {
        return orderService.confirmOrder(orderId);
    }

    @PreAuthorize("hasAuthority('ROLE_FARMMANAGER')")
    @PutMapping("/{orderId}/reject")
    public OrderResponse rejectOrder(
            @PathVariable Long orderId
    ) {
        return orderService.rejectOrder(orderId);
    }

    // =======================
    // SHIPPING
    // =======================
    @PreAuthorize("hasAuthority('ROLE_SHIPPINGMANAGER')")
    @PutMapping("/{orderId}/complete")
    public ResponseEntity<OrderResponse> completeOrder(
            @PathVariable Long orderId
    ) {
        return ResponseEntity.ok(orderService.completeOrder(orderId));
    }

    // =======================
    static class JwtTestResponse {
        public String username;
        public List<String> roles;

        public JwtTestResponse(String username, List<String> roles) {
            this.username = username;
            this.roles = roles;
        }
    }

    /**
     * =======================
     * RETAILER – MY ORDERS
     * =======================
     */
    @GetMapping("/my")
public ResponseEntity<List<OrderResponse>> getMyOrders(Authentication authentication) {

    if (authentication == null || !authentication.isAuthenticated()) {
        return ResponseEntity.status(401).build();
    }

    JwtUser jwtUser =
            (JwtUser) authentication.getPrincipal();

    String buyerEmail = jwtUser.getEmail(); // ✅ ĐÚNG

    return ResponseEntity.ok(
            orderService.getOrdersByBuyerEmail(buyerEmail)
    );
}


    @GetMapping("/detail/{orderId}")
    public ResponseEntity<OrderResponse> getOrderDetail(
            @PathVariable Long orderId,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

       JwtUser jwtUser = (JwtUser) authentication.getPrincipal();
        String buyerEmail = jwtUser.getEmail();

        return ResponseEntity.ok(
                orderService.getOrderDetailByIdAndBuyerEmail(orderId, buyerEmail)
        );
    }
}
