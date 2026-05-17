package com.bicap.auth.factory;

import java.util.HashSet;
import java.util.Set;
import com.bicap.auth.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.bicap.auth.dto.AuthRequest;
import com.bicap.auth.model.ERole;
import com.bicap.auth.model.Role;
import com.bicap.auth.model.User;
import com.bicap.auth.model.UserStatus;
import com.bicap.auth.repository.RoleRepository;

@Component
public class UserRegistrationFactory {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    
    public UserRegistrationFactory(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User createUser(AuthRequest authRequest) {
        String requestedRole = authRequest.getRole().toUpperCase();
        
        // Ensure role has ROLE_ prefix
        if (!requestedRole.startsWith("ROLE_")) {
            requestedRole = "ROLE_" + requestedRole;
        }

        if (requestedRole.equals("ROLE_ADMIN") || requestedRole.equals("ROLE_DELIVERYDRIVER")) {
            throw new IllegalArgumentException("Cannot self-register for high-priviledge roles.");
        }

        User user = new User();

        Set<Role> roles = new HashSet<>();

        if (requestedRole.equals("ROLE_FARMMANAGER")) {
            roles.add(getRole(ERole.ROLE_FARMMANAGER));
            user.setStatus(UserStatus.ACTIVE);
        }
        else if (requestedRole.equals("ROLE_RETAILER")) {
            roles.add(getRole(ERole.ROLE_RETAILER));
            user.setStatus(UserStatus.ACTIVE);
        }
        else if (requestedRole.equals("ROLE_SHIPPINGMANAGER")) {
            roles.add(getRole(ERole.ROLE_SHIPPINGMANAGER));
            user.setStatus(UserStatus.ACTIVE);
        }
        else {
            roles.add(getRole(ERole.ROLE_GUEST));
            user.setStatus(UserStatus.ACTIVE);
        }
        user.setEmail(authRequest.getEmail());
        // Auto-generate username from email if not provided
        String username = authRequest.getUsername();
        if (username == null || username.trim().isEmpty()) {
            username = authRequest.getEmail().split("@")[0]; // Use part before @ as username
        }
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(authRequest.getPassword()));
        user.setRole(roles);
        return userRepository.save(user);
    }

    public Role getRole(ERole roleName) {
        return roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("System Error: Role " + roleName + " not found in the database."));
    }
}
