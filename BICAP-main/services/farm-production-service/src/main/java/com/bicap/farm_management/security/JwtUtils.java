package com.bicap.farm_management.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.ArrayList;
import java.util.List;

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

    private Key key(String base64Secret) {
        byte[] keyBytes = Decoders.BASE64.decode(base64Secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public Claims getClaimsFromToken(String token) {
        for (String secret : allSecrets()) {
            try {
                return Jwts.parserBuilder().setSigningKey(key(secret)).build()
                        .parseClaimsJws(token).getBody();
            } catch (Exception e) {
                // try next key
            }
        }
        throw new JwtException("JWT could not be parsed with any configured key");
    }

    public boolean validateToken(String authToken) {
        for (String secret : allSecrets()) {
            try {
                Jwts.parserBuilder().setSigningKey(key(secret)).build().parseClaimsJws(authToken);
                return true;
            } catch (SignatureException e) {
                logger.debug("Invalid JWT signature with one key: {}", e.getMessage());
            } catch (MalformedJwtException | ExpiredJwtException | UnsupportedJwtException | IllegalArgumentException e) {
                logger.debug("JWT parse failed with one key: {}", e.getMessage());
            }
        }
        logger.error("JWT validation failed for all configured keys");
        return false;
    }
}