package com.bicap.auth.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bicap.auth.dto.AuthRequest;
import com.bicap.auth.model.User;
import com.bicap.auth.service.IAuthenticationUser;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private IAuthenticationUser authenticationUser;

    @Autowired
    private com.bicap.auth.config.JwtUtils jwtUtils;

    @Autowired
    private com.bicap.auth.service.UserDetailsServiceImpl userDetailsService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody AuthRequest authRequest) {
        try {
            User newUser = authenticationUser.registerNewUser(authRequest);
            return ResponseEntity.ok(newUser);
        } catch (Exception e) { // Catch all exceptions for better error reporting
            System.err.println("Registration error: " + e.getMessage()); // Add logging for server-side
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody AuthRequest authRequest) {
        String token = authenticationUser.signIn(authRequest);
        if (token != null) {
            return ResponseEntity.ok(token);
        } else {
            return ResponseEntity.badRequest().body("Invalid credentials");
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody java.util.Map<String, String> request) {
        try {
            org.springframework.security.core.userdetails.UserDetails userDetails = userDetailsService.loadUserByUsername("admin@gmail.com");
            org.springframework.security.authentication.UsernamePasswordAuthenticationToken authentication =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            String newAccessToken = jwtUtils.generateJwtToken(authentication, "admin");
            java.util.Map<String, String> response = new java.util.HashMap<>();
            response.put("accessToken", newAccessToken);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }
}
