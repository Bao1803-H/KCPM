package com.example.admin_service.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.function.Function;

@Component
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

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

    private Key getSignInKey(String base64Secret) {
        byte[] keyBytes = Decoders.BASE64.decode(base64Secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String getUserNameFromJwtToken(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claims != null ? claimsResolver.apply(claims) : null;
    }

    private Claims extractAllClaims(String token) {
        for (String secret : allSecrets()) {
            try {
                return Jwts.parserBuilder()
                        .setSigningKey(getSignInKey(secret))
                        .build()
                        .parseClaimsJws(token)
                        .getBody();
            } catch (JwtException | IllegalArgumentException e) {
                // try next key
            }
        }
        logger.warn("JWT could not be parsed with any configured key");
        return null;
    }

    public boolean validateToken(String authToken) {
        for (String secret : allSecrets()) {
            try {
                Jwts.parserBuilder().setSigningKey(getSignInKey(secret)).build().parseClaimsJws(authToken);
                return true;
            } catch (MalformedJwtException | ExpiredJwtException | UnsupportedJwtException | IllegalArgumentException e) {
                // try next key
            }
        }
        logger.error("JWT validation failed for all configured keys");
        return false;
    }

    public List<String> getRolesFromJwtToken(String token) {
        Claims claims = extractAllClaims(token);
        if (claims == null) return Collections.emptyList();
        Object roles = claims.get("roles");
        if (roles instanceof List) {
            return (List<String>) roles;
        } else if (roles instanceof String) {
            return Arrays.asList(((String) roles).split(","));
        }
        return Collections.emptyList();
    }
}
