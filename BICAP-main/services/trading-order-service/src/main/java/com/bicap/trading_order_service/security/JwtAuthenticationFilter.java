package com.bicap.trading_order_service.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    public JwtAuthenticationFilter(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        /* =====================================================
           1️⃣ LẤY TOKEN – HEADER HOẶC COOKIE
        ===================================================== */
        String token = null;

        // Ưu tiên Authorization header (Postman)
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            token = header.substring(7);
        }

        // Nếu không có header → lấy từ cookie (Frontend)
        if (token == null && request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                String name = cookie.getName();
                if ("admin_token".equals(name) ||
                        "retailer_token".equals(name) ||
                        "farm_token".equals(name) ||
                        "shipping_manager_token".equals(name) ||
                        "shipping_driver_token".equals(name) ||
                        "auth_token".equals(name)) { // legacy fallback
                    token = cookie.getValue();
                    break;
                }
            }
        }

        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        /* =====================================================
           2️⃣ PARSE JWT
        ===================================================== */
        Claims claims = jwtUtils.parseClaims(token);

        if (claims == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String username = claims.getSubject();
        String email = claims.get("email", String.class);
        Long userId = jwtUtils.getUserId(token);

        /* =====================================================
           3️⃣ XỬ LÝ ROLES (STRING hoặc LIST)
        ===================================================== */
        Object rolesObj = claims.get("roles");

        if (rolesObj == null) {
            filterChain.doFilter(request, response);
            return;
        }

        List<String> roles = new ArrayList<>();

        if (rolesObj instanceof String roleStr) {
            roles.add(roleStr.trim());
        } else if (rolesObj instanceof List<?> roleList) {
            roles = roleList.stream()
                    .map(r -> r.toString().trim())
                    .collect(Collectors.toList());
        }

        if (roles.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        List<SimpleGrantedAuthority> authorities =
                roles.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList());

        /* =====================================================
           4️⃣ SET SECURITY CONTEXT
        ===================================================== */
        JwtUser jwtUser = new JwtUser(
                username,
                email,
                roles,
                userId
        );

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        jwtUser,
                        null,
                        authorities
                );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }
}
