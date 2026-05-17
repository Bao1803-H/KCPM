package com.bicap.shipping_manager_service.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.ArrayList;
import java.util.List;

@Component("securityJwtUtils")
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

    private Key key(String base64Secret) {
        byte[] keyBytes = Decoders.BASE64.decode(base64Secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public boolean validateJwtToken(String authToken) {
        for (String secret : allSecrets()) {
            try {
                Jwts.parserBuilder().setSigningKey(key(secret)).build().parseClaimsJws(authToken);
                return true;
            } catch (Exception e) {
                // try next key
            }
        }
        logger.error("Invalid JWT token: validation failed for all keys");
        return false;
    }

    public Claims getClaimsFromJwtToken(String token) {
        for (String secret : allSecrets()) {
            try {
                return Jwts.parserBuilder().setSigningKey(key(secret)).build().parseClaimsJws(token).getBody();
            } catch (Exception e) {
                // try next key
            }
        }
        throw new io.jsonwebtoken.JwtException("JWT could not be parsed with any configured key");
    }
}