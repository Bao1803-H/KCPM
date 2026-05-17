package com.bicap.farm_management.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String jwt = parseJwt(request);
        if (jwt == null) {
            System.out.println("⚠️ [JWT Filter] No JWT token found in request");
        } else if (!jwtUtils.validateToken(jwt)) {
            System.out.println("⚠️ [JWT Filter] JWT token validation failed");
        }
        
        if (jwt != null && jwtUtils.validateToken(jwt)) {
            try {
                Claims claims = jwtUtils.getClaimsFromToken(jwt);
                    
                    // 1. Extract User Details
                    String username = claims.getSubject();
                    Long userId = claims.get("userId", Long.class);
                    Object rolesObj = claims.get("roles");
                    String rolesStr = null;
                    
                    // Handle roles as String or List
                    if (rolesObj instanceof String) {
                        rolesStr = ((String) rolesObj).trim();
                    } else if (rolesObj instanceof List) {
                        rolesStr = ((List<?>) rolesObj).stream()
                                .map(obj -> {
                                    if (obj == null) return "";
                                    return (obj instanceof String) ? ((String) obj).trim() : obj.toString().trim();
                                })
                                .filter(s -> !s.isEmpty())
                                .collect(Collectors.joining(","));
                    } else if (rolesObj != null) {
                        rolesStr = rolesObj.toString().trim();
                    }

                    System.out.println("🔐 [JWT Filter] Request: " + request.getRequestURI());
                    System.out.println("🔐 [JWT Filter] Username: " + username);
                    System.out.println("🔐 [JWT Filter] UserId: " + userId);
                    System.out.println("🔐 [JWT Filter] Raw roles from token (type: " + (rolesObj != null ? rolesObj.getClass().getSimpleName() : "null") + "): " + rolesStr);

                    // 2. Set userId to request attribute for Controllers to use
                    if (userId != null) {
                        request.setAttribute("userId", userId);
                    }

                    // 3. Convert roles to GrantedAuthority
                    List<SimpleGrantedAuthority> authorities;
                    if (rolesStr == null || rolesStr.isBlank()) {
                        System.out.println("⚠️ [JWT Filter] No roles found in token! User will not have access to protected endpoints.");
                        authorities = List.of();
                    } else {
                        authorities = Arrays.stream(rolesStr.split(","))
                                .map(role -> {
                                    String trimmedRole = role.trim();
                                    if (!trimmedRole.startsWith("ROLE_")) {
                                        trimmedRole = "ROLE_" + trimmedRole;
                                    }
                                    System.out.println("🔐 [JWT Filter] Creating authority: " + trimmedRole);
                                    return new SimpleGrantedAuthority(trimmedRole);
                                })
                                .collect(Collectors.toList());
                    }
                    System.out.println("🔐 [JWT Filter] Total authorities: " + authorities.size());
                    if (authorities.isEmpty()) {
                        System.out.println("⚠️ [JWT Filter] WARNING: No authorities set! Access will be denied.");
                    } else {
                        authorities.forEach(auth -> System.out.println("  ✓ " + auth.getAuthority()));
                    }

                    // 4. Create Authentication object
                    UsernamePasswordAuthenticationToken authentication = 
                            new UsernamePasswordAuthenticationToken(username, null, authorities);
                    
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // 5. Set Security Context
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    System.out.println("✓ [JWT Filter] Authentication set successfully");
            } catch (Exception e) {
                System.err.println("❌ [JWT Filter] Error processing token: " + e.getMessage());
                e.printStackTrace();
            }
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (headerAuth != null && headerAuth.startsWith("Bearer ")) {
            String token = headerAuth.substring(7);
            if (token != null && !token.isBlank() && !"undefined".equals(token) && !"null".equals(token)) {
                return token;
            }
        }

        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                String name = cookie.getName();
                if ("admin_token".equals(name) ||
                        "retailer_token".equals(name) ||
                        "farm_token".equals(name) ||
                        "shipping_manager_token".equals(name) ||
                        "shipping_driver_token".equals(name) ||
                        "auth_token".equals(name)) { // legacy fallback
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}