CREATE TABLE user_business_licenses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    license_path VARCHAR(512) NOT NULL,
    original_name VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_profile_id BIGINT NOT NULL,
    
    -- Foreign key constraint
    CONSTRAINT fk_license_user_profile 
        FOREIGN KEY (user_profile_id) 
        REFERENCES user_profiles(id) 
        ON DELETE CASCADE,
    
    -- Index for foreign key
    INDEX idx_user_profile_id (user_profile_id),
    
    -- Optional: index for license_path if you search by it often
    INDEX idx_license_path (license_path)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;