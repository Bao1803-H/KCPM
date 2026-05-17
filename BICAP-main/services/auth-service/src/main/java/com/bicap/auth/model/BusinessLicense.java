package com.bicap.auth.model;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Base64;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "user_business_licenses")
public class BusinessLicense {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "license_path", nullable = false, length = 512)  // Path/URL to the file
    private String licensePath;

    @Transient
    private String licenseBase64;

    // Optional extras
    @Column(name = "original_name", length = 255)
    private String originalName;

    @Column(name = "uploaded_at")
    private Instant uploadedAt = Instant.now();

    @JsonBackReference  // Ignore during serialization to break cycle
    @ManyToOne
    @JoinColumn(name = "user_profile_id", nullable = false)
    private UserProfile userProfile;

}
