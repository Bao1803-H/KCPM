package com.bicap.farm_management.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Debug-only filter to confirm whether Authorization/cookies
 * reach farm-production-service for season monitor endpoints.
 *
 * NOTE: Does not log full tokens.
 */
@Component
public class RequestHeaderLoggingFilter extends OncePerRequestFilter {

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        // Only log Season Monitor related endpoints to reduce noise
        return uri == null || !uri.startsWith("/api/production-batches");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String uri = request.getRequestURI();

        String auth = request.getHeader("Authorization");
        String authPreview = null;
        if (auth != null) {
            String trimmed = auth.trim();
            // Log only prefix + first chars (avoid leaking tokens)
            authPreview = trimmed.length() <= 30 ? trimmed : trimmed.substring(0, 30) + "...";
        }

        String cookieNames = "none";
        if (request.getCookies() != null && request.getCookies().length > 0) {
            cookieNames = Arrays.stream(request.getCookies())
                    .map(Cookie::getName)
                    .collect(Collectors.joining(", "));
        }

        System.out.println("🧾 [RequestHeaders] " + request.getMethod() + " " + uri
                + " | hasAuthorization=" + (auth != null)
                + " | authorizationPreview=" + (authPreview != null ? authPreview : "null")
                + " | cookies=" + cookieNames);

        filterChain.doFilter(request, response);
    }
}

