package com.bicap.auth.config;

import java.security.Key;
import java.util.Date;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import com.bicap.auth.service.UserDetailsImpl;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;

@Service
public class JwtUtils {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${bicap.app.jwtExpirationMs}")
    private int jwtExpirationMs;

    @Value("${bicap.app.jwtSecret:}")
    private String jwtSecretDefault;

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

    /** Kong consumer key = issuer (admin-app, retailer-app, farm-management-app, shipping-manager-app, shipping-driver-app) */
    private static final String ISSUER_ADMIN = "admin-app";
    private static final String ISSUER_RETAILER = "retailer-app";
    private static final String ISSUER_FARM = "farm-management-app";
    private static final String ISSUER_SHIPPING_MGR = "shipping-manager-app";
    private static final String ISSUER_SHIPPING_DRIVER = "shipping-driver-app";

    public String generateJwtToken(Authentication authentication) {
        return generateJwtToken(authentication, null);
    }

    public String generateJwtToken(Authentication authentication, String clientId) {
        UserDetailsImpl userPrinciple = (UserDetailsImpl) authentication.getPrincipal();
        String roles = userPrinciple.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.joining(","));

        String secret = secretForClient(clientId);
        String issuer = issuerForClient(clientId);
        Key key = keyFromBase64(secret);

        return Jwts.builder()
            .setSubject(userPrinciple.getUsername())
            .claim("userId", userPrinciple.getId())
            .claim("email", userPrinciple.getEmail())
            .claim("roles", roles)
            .claim("aud", issuer)
            .setIssuer(issuer)
            .setIssuedAt(new Date())
            .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
            .signWith(key)
            .compact();
    }

    private String secretForClient(String clientId) {
        if (clientId != null) {
            switch (clientId.toLowerCase()) {
                case "admin": return jwtSecretAdmin != null && !jwtSecretAdmin.isEmpty() ? jwtSecretAdmin : jwtSecretDefault;
                case "retailer": return jwtSecretRetailer != null && !jwtSecretRetailer.isEmpty() ? jwtSecretRetailer : jwtSecretDefault;
                case "farm": return jwtSecretFarm != null && !jwtSecretFarm.isEmpty() ? jwtSecretFarm : jwtSecretDefault;
                case "shippingmanager": return jwtSecretShippingManager != null && !jwtSecretShippingManager.isEmpty() ? jwtSecretShippingManager : jwtSecretDefault;
                case "shippingdriver": return jwtSecretShippingDriver != null && !jwtSecretShippingDriver.isEmpty() ? jwtSecretShippingDriver : jwtSecretDefault;
            }
        }
        return jwtSecretDefault != null && !jwtSecretDefault.isEmpty() ? jwtSecretDefault : jwtSecretRetailer;
    }

    private String issuerForClient(String clientId) {
        if (clientId != null) {
            switch (clientId.toLowerCase()) {
                case "admin": return ISSUER_ADMIN;
                case "retailer": return ISSUER_RETAILER;
                case "farm": return ISSUER_FARM;
                case "shippingmanager": return ISSUER_SHIPPING_MGR;
                case "shippingdriver": return ISSUER_SHIPPING_DRIVER;
            }
        }
        return ISSUER_RETAILER;
    }

    private Key keyFromBase64(String base64Secret) {
        if (base64Secret == null || base64Secret.isEmpty()) {
            throw new IllegalStateException("JWT secret is not configured for this client");
        }
        byte[] keyBytes = Decoders.BASE64.decode(base64Secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String getUserNameFromJwtToken(String token) {
        for (String secret : new String[]{jwtSecretAdmin, jwtSecretRetailer, jwtSecretFarm, jwtSecretShippingManager, jwtSecretShippingDriver, jwtSecretDefault}) {
            if (secret == null || secret.isEmpty()) continue;
            try {
                return Jwts.parserBuilder().setSigningKey(keyFromBase64(secret)).build()
                        .parseClaimsJws(token).getBody().getSubject();
            } catch (Exception e) {
                // try next key
            }
        }
        return null;
    }

    public boolean validateToken(String authToken) {
        return validateTokenWithAnyKey(authToken);
    }

    private boolean validateTokenWithAnyKey(String authToken) {
        for (String secret : new String[]{jwtSecretAdmin, jwtSecretRetailer, jwtSecretFarm, jwtSecretShippingManager, jwtSecretShippingDriver, jwtSecretDefault}) {
            if (secret == null || secret.isEmpty()) continue;
            try {
                Jwts.parserBuilder().setSigningKey(keyFromBase64(secret)).build().parseClaimsJws(authToken);
                return true;
            } catch (Exception e) {
                // try next key
            }
        }
        logger.error("JWT validation failed for all configured keys");
        return false;
    }
}
