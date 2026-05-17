package com.bicap.auth.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value; // Added import
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import com.bicap.auth.service.UserDetailsImpl;
import org.springframework.transaction.annotation.Transactional;

import com.bicap.auth.config.JwtUtils;
import com.bicap.auth.dto.AuthRequest;
import com.bicap.auth.dto.UserProfileRequest;
import com.bicap.auth.factory.UserRegistrationFactory;
import com.bicap.auth.model.BusinessLicense;
import com.bicap.auth.model.ERole;
import com.bicap.auth.model.User;
import com.bicap.auth.model.UserProfile;
import com.bicap.auth.repository.UserProfileRepository;
import com.bicap.auth.repository.UserRepository;

@Service
public class AuthenticationUser implements IAuthenticationUser {

    @Value("${storage.upload-dir}") // Injected property
    private String uploadDir;

    @Autowired private UserRepository userRepository;
    @Autowired private UserProfileRepository userProfileRepository;
    @Autowired private UserRegistrationFactory userRegistrationFactory;
    @Autowired private AuthenticationManager authManager;
    @Autowired private JwtUtils jwtUtils;
    @Autowired private ProducerMQ producerMQ;

    @Override
    public User registerNewUser(AuthRequest authRequest) {
        if (userRepository.findByUsername(authRequest.getUsername()).isPresent()) {
            throw new RuntimeException("Username already taken");
        }
        User user = userRegistrationFactory.createUser(authRequest);

        boolean isFarmManager = user.getRole().stream()
                                .anyMatch(role -> role.getName() == ERole.ROLE_FARMMANAGER);
        
        if (isFarmManager) {
            Map<String, Object> farmerData = new HashMap<>();
            farmerData.put("id", user.getId());
            farmerData.put("username", user.getUsername());
            farmerData.put("email", user.getEmail());
            producerMQ.sendFarmUserData("CREATE_FARMER", farmerData);
        }
        return user;
    }

    @Override
    public String signIn(AuthRequest authRequest) {
        try {
            Authentication authentication = authManager.authenticate(new UsernamePasswordAuthenticationToken(authRequest.getEmail(), authRequest.getPassword()));
            String clientId = authRequest.getClientId();
            if (clientId != null && !clientId.isBlank()) {
                if (!userHasRoleForClient(authentication, clientId)) {
                    return null;
                }
            }
            return jwtUtils.generateJwtToken(authentication, clientId);
        } catch (BadCredentialsException e) {
            return null;
        }
    }

    private boolean userHasRoleForClient(Authentication authentication, String clientId) {
        String roles = authentication.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .collect(java.util.stream.Collectors.joining(","));
        String c = clientId.toLowerCase();
        if ("admin".equals(c)) return roles.contains("ROLE_ADMIN");
        if ("retailer".equals(c)) return roles.contains("ROLE_RETAILER");
        if ("farm".equals(c)) return roles.contains("ROLE_FARMMANAGER");
        if ("shippingmanager".equals(c)) return roles.contains("ROLE_SHIPPINGMANAGER");
        if ("shippingdriver".equals(c)) return roles.contains("ROLE_DELIVERYDRIVER");
        return true;
    }

    @Override
    @Transactional
    public UserProfile updateUserProfile(UserProfileRequest userProfileRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetailsImpl = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findByUsername(userDetailsImpl.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isFarmManager = user.getRole().stream()
            .anyMatch(role -> role.getName() == ERole.ROLE_FARMMANAGER);
        
        if (!isFarmManager) {
            throw new RuntimeException("Only Farm Managers can update their profile information.");
        }

        UserProfile userProfile = userProfileRepository.findByUser(user)
            .orElse(new UserProfile());

        // Ensure the upload directory exists
        File uploadDirFile = new File(uploadDir);
        if (!uploadDirFile.exists()) {
            uploadDirFile.mkdirs();
        }

        // Clear existing licenses and re-add new ones
        userProfile.getBusinessLicenses().clear();
        if (userProfileRequest.getBusinessLicenses() != null 
            && !userProfileRequest.getBusinessLicenses().isEmpty()) {
            
            for (var license : userProfileRequest.getBusinessLicenses()) {
                try {
                    String base64Data = license.getData();
                    if (base64Data.contains(",")) {
                        base64Data = base64Data.split(",")[1];
                    }
                    byte[] decodedBytes = Base64.getDecoder().decode(base64Data);
                    
                    String filename = UUID.randomUUID().toString() + ".png"; 
                    // Improve: Detect extension from MIME if possible (see below)
                    
                    Path destinationFile = Paths.get(uploadDir, filename);
                    
                    Files.write(destinationFile, decodedBytes);

                    BusinessLicense lic = new BusinessLicense();
                    lic.setLicensePath("/api/update/license/" + filename);
                    lic.setOriginalName(license.getOriginalName()); // Set if sent from frontend
                    lic.setLicenseBase64(Base64.getEncoder().encodeToString(decodedBytes)); // Set transient field for immediate response
                    lic.setUserProfile(userProfile);
                    userProfile.getBusinessLicenses().add(lic);
                } catch (IOException | IllegalArgumentException e) {
                    throw new RuntimeException("Error processing business license: " + e.getMessage(), e);
                }
            }
        }

        if (userProfileRequest.getAddress() != null) {
            userProfile.setAddress(userProfileRequest.getAddress());
        }

        if (userProfileRequest.getAvatarBase64() != null && !userProfileRequest.getAvatarBase64().isBlank()) {
            try {
                String avatarData = userProfileRequest.getAvatarBase64();
                if (avatarData.contains(",")) {
                    avatarData = avatarData.split(",")[1];
                }
                byte[] decodedBytes = Base64.getDecoder().decode(avatarData);
                userProfile.setAvatarBytes(decodedBytes);
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid Base64 avatar data");
            }
        }

        if (userProfile.getId() == null) {
            userProfile.setUser(user);
        }

        // Log the avatarBytes length before saving
        if (userProfile.getAvatarBytes() != null) {
            System.out.println("Avatar bytes length before save: " + userProfile.getAvatarBytes().length);
        } else {
            System.out.println("Avatar bytes are null before save.");
        }

        return userProfileRepository.save(userProfile);
    }
}
