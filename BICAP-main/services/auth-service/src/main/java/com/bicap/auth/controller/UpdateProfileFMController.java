package com.bicap.auth.controller;

import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value; // Added import
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import com.bicap.auth.dto.UserProfileRequest;
import com.bicap.auth.model.User;
import com.bicap.auth.model.UserProfile;
import com.bicap.auth.model.BusinessLicense;
import com.bicap.auth.repository.UserProfileRepository;
import com.bicap.auth.repository.UserRepository;
import com.bicap.auth.service.AuthenticationUser;
import com.bicap.auth.service.UserDetailsImpl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/update")
public class UpdateProfileFMController {

    @Value("${storage.upload-dir}") // Injected property
    private String uploadDir;

    @Autowired
    private AuthenticationUser authUser;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private UserRepository userRepository;
    
    @PostMapping("/profile")
    public ResponseEntity<?> updatingProfile(@RequestBody UserProfileRequest dto) {
        try {
            // Log auth for debug
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("POST /profile - Auth: " + (auth != null ? auth.getName() + " roles: " + auth.getAuthorities() : "No auth"));

            UserProfile userProfile = authUser.updateUserProfile(dto);
            if (userProfile == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Profile not found"));
            }
            return ResponseEntity.ok(userProfile);
        } catch (Exception e) {
            System.err.println("Error updating profile: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of(
                    "error", e.getMessage() != null ? e.getMessage() : "Unknown error",
                    "timestamp", Instant.now().toString()
                )
            );
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> fetchProfile() {
        try {
            // Log auth for debug
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("GET /profile - Auth: " + (auth != null ? auth.getName() + " roles: " + auth.getAuthorities() : "No auth"));

            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            
            User user = userRepository.findByUsername(userDetails.getUsername()) 
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            UserProfile userProfile = userProfileRepository.findByUser(user) 
                .orElse(null);
            
            if (userProfile == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Profile not found"));
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setCacheControl(CacheControl.noCache().mustRevalidate());
            headers.setPragma("no-cache");
            headers.setExpires(0);

            if (userProfile != null) {
                Hibernate.initialize(userProfile.getBusinessLicenses());  // Force load (import org.hibernate.Hibernate)
                
                // Populate base64 for business licenses by reading from uploadDir
                for (BusinessLicense license : userProfile.getBusinessLicenses()) {
                    try {
                        String pathStr = license.getLicensePath();
                        // Extract filename from URL (e.g. /api/update/license/abc.png -> abc.png)
                        String filename = pathStr.substring(pathStr.lastIndexOf('/') + 1);
                        Path filePath = Paths.get(uploadDir).resolve(filename);
                        if (Files.exists(filePath)) {
                            byte[] bytes = Files.readAllBytes(filePath);
                            license.setLicenseBase64(Base64.getEncoder().encodeToString(bytes));
                        }
                    } catch (Exception e) {
                        System.err.println("Error loading license file: " + e.getMessage());
                    }
                }
            }
            
            return new ResponseEntity<>(userProfile, headers, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error fetching profile: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of(
                    "error", e.getMessage() != null ? e.getMessage() : "Unknown error",
                    "timestamp", Instant.now().toString()
                )
            );
        }
    }

    // New endpoint to serve business license files
    @GetMapping("/license/{filename}")
    public ResponseEntity<Resource> serveLicenseFile(@PathVariable String filename) {
        try {
            Path file = Paths.get(uploadDir).resolve(filename);
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() && resource.isReadable()) {  // Added readable check
                String contentType = Files.probeContentType(file);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                System.err.println("File not found or not readable: " + file.toString());  // Log for debug
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {  // Catch all
            System.err.println("Error serving license file: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}