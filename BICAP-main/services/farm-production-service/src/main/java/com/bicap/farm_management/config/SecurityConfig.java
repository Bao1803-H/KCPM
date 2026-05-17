package com.bicap.farm_management.config;

import com.bicap.farm_management.security.JwtAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final com.bicap.farm_management.security.RequestHeaderLoggingFilter requestHeaderLoggingFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthFilter,
            com.bicap.farm_management.security.RequestHeaderLoggingFilter requestHeaderLoggingFilter
    ) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.requestHeaderLoggingFilter = requestHeaderLoggingFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // 1. Cho phép Swagger truy cập tự do
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                
                // 2. CHỈ CHO PHÉP ADMIN VÀ FARM_MANAGER TRUY CẬP CÁC API NGHIỆP VỤ
                .requestMatchers("/api/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_FARMMANAGER")
                
                // 3. Các request khác phải xác thực
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(requestHeaderLoggingFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(new AuthenticationEntryPoint() {
                    @Override
                    public void commence(HttpServletRequest request, HttpServletResponse response,
                                       AuthenticationException authException) throws IOException {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json;charset=UTF-8");
                        
                        Map<String, Object> body = new HashMap<>();
                        body.put("error", "Unauthorized");
                        body.put("message", "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.");
                        body.put("timestamp", Instant.now().toString());
                        body.put("status", 401);
                        body.put("path", request.getRequestURI());
                        
                        ObjectMapper mapper = new ObjectMapper();
                        response.getWriter().write(mapper.writeValueAsString(body));
                    }
                })
                .accessDeniedHandler(new AccessDeniedHandler() {
                    @Override
                    public void handle(HttpServletRequest request, HttpServletResponse response,
                                      AccessDeniedException accessDeniedException) throws IOException {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json;charset=UTF-8");
                        
                        String currentUser = "unknown";
                        String currentRoles = "none";
                        try {
                            org.springframework.security.core.Authentication auth = 
                                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                            if (auth != null) {
                                currentUser = auth.getName();
                                currentRoles = auth.getAuthorities().stream()
                                    .map(a -> a.getAuthority())
                                    .collect(java.util.stream.Collectors.joining(", "));
                            }
                        } catch (Exception e) {
                            // Ignore
                        }
                        
                        Map<String, Object> body = new HashMap<>();
                        body.put("error", "Access Denied");
                        body.put("message", "Bạn không có quyền thực hiện thao tác này. Yêu cầu role: ROLE_FARMMANAGER hoặc ROLE_ADMIN");
                        body.put("timestamp", Instant.now().toString());
                        body.put("status", 403);
                        body.put("path", request.getRequestURI());
                        body.put("currentUser", currentUser);
                        body.put("currentRoles", currentRoles);
                        
                        ObjectMapper mapper = new ObjectMapper();
                        response.getWriter().write(mapper.writeValueAsString(body));
                    }
                })
            );

        return http.build();
    }
}
