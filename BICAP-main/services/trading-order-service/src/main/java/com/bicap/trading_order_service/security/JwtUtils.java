package com.bicap.trading_order_service.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtUtils {

    private static final Logger log = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${bicap.app.jwtSecret:}")
    private String jwtSecret;
    @Value("${bicap.app.jwtSecret.admin:}")
    private String jwtSecretAdmin;
    @Value("${bicap.app.jwtSecret.retailer:}")
    private String jwtSecretRetailer;
    @Value("${bicap.app.jwtSecret.farm:}")
    private String jwtSecretFarm;
    @Value("${bicap.app.jwtSecret.shippingManager:}")
    private String jwtSecretShippingManager;
    @Value("${bicap.app.jwtSecret.shippingDriver:}")
    private String jwtSecretShippingDriver;

    private List<String> allSecrets() {
        List<String> list = new ArrayList<>();
        if (jwtSecretAdmin != null && !jwtSecretAdmin.isEmpty()) list.add(jwtSecretAdmin);
        if (jwtSecretRetailer != null && !jwtSecretRetailer.isEmpty()) list.add(jwtSecretRetailer);
        if (jwtSecretFarm != null && !jwtSecretFarm.isEmpty()) list.add(jwtSecretFarm);
        if (jwtSecretShippingManager != null && !jwtSecretShippingManager.isEmpty()) list.add(jwtSecretShippingManager);
        if (jwtSecretShippingDriver != null && !jwtSecretShippingDriver.isEmpty()) list.add(jwtSecretShippingDriver);
        if (jwtSecret != null && !jwtSecret.isEmpty()) list.add(jwtSecret);
        return list;
    }

    private Key getKey(String base64Secret) {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Secret));
    }

    /**
     * Parse claims using any configured per-role key
     */
    public Claims parseClaims(String token) {
        for (String secret : allSecrets()) {
            try {
                return Jwts.parserBuilder()
                        .setSigningKey(getKey(secret))
                        .build()
                        .parseClaimsJws(token)
                        .getBody();
            } catch (JwtException | IllegalArgumentException e) {
                // try next key
            }
        }
        log.warn("Invalid JWT token: could not parse with any configured key");
        return null;
    }

    /**
     * ✅ Validate token (chữ ký + hết hạn)
     */
    public boolean validateToken(String token) {
        Claims claims = parseClaims(token);
        if (claims == null) return false;

        Date expiration = claims.getExpiration();
        return expiration == null || expiration.after(new Date());
    }

    // ================= GETTERS =================

    public String getUsername(String token) {
        Claims claims = parseClaims(token);
        return claims != null ? claims.getSubject() : null;
    }

    public String getEmail(String token) {
        Claims claims = parseClaims(token);
        return claims != null ? claims.get("email", String.class) : null;
    }

    /**
     * Auth JWT includes "userId" claim (user id from auth users table).
     * Used as buyer_id when creating orders.
     */
    public Long getUserId(String token) {
        Claims claims = parseClaims(token);
        if (claims == null) return null;
        Object v = claims.get("userId");
        if (v instanceof Number n) return n.longValue();
        return null;
    }

    /**
     * ✅ Chuẩn hoá role
     * JWT hiện tại: roles = "ROLE_RETAILER" hoặc List<String>
     */
    public List<String> getRoles(String token) {
        Claims claims = parseClaims(token);
        if (claims == null) return List.of();

        Object rolesObj = claims.get("roles");

        if (rolesObj instanceof String roleStr) {
            return List.of(roleStr);
        }

        if (rolesObj instanceof List<?> roleList) {
            return roleList.stream()
                    .map(Object::toString)
                    .collect(Collectors.toList());
        }

        return List.of();
    }
}
