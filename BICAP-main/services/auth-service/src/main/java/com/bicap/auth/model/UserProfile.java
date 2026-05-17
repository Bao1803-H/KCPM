package com.bicap.auth.model;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Data;

@Data
@Entity
@Table(name = "user_profiles")
public class UserProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "address", nullable = true)
    private String address;

    @Column(name = "avatar", columnDefinition =  "LONGBLOB")
    @Lob
    private byte[] avatarBytes;

    @Transient
    private String avatarBase64;

    @JsonManagedReference  // Serialize this side
    @OneToMany(mappedBy = "userProfile", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<BusinessLicense> businessLicenses = new ArrayList<>();

    @JsonIgnore  // Already there, good—prevents User → UserProfile → User loop
    @OneToOne
    @JoinColumn(name="user_id", nullable = false, unique = true)
    private User user;

    @JsonProperty("avatarBase64")
    public String getAvatarBase64() {
        if (avatarBytes != null) {
            return Base64.getEncoder().encodeToString(avatarBytes);
        }
        return null;
    }

    public void setAvatarBase64(String base64) {
        if (base64 != null && !base64.isBlank()) {
            this.avatarBytes = Base64.getDecoder().decode(base64);
        } else {
            this.avatarBytes = null;
        }
    }
}