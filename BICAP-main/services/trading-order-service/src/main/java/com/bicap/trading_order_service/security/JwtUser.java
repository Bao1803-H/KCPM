package com.bicap.trading_order_service.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

public class JwtUser implements UserDetails {

    private final String username;
    private final String email;
    private final List<String> roles;
    private final Long userId;

    public JwtUser(String username, String email, List<String> roles, Long userId) {
        this.username = username;
        this.email = email;
        this.roles = roles;
        this.userId = userId;
    }

    // 🔑 Spring Security dùng username này
    @Override
    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public Long getUserId() {
        return userId;
    }

    public List<String> getRoles() {
        return roles;
    }

    // ✅ CHUẨN SPRING SECURITY
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }

    // Không dùng password vì JWT
    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    // 🔥 FIX BUG authentication.getName()
    @Override
    public String toString() {
        return this.username;
    }
}
