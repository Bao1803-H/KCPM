-- Image Storage Database
CREATE DATABASE IF NOT EXISTS image_storage_db;
USE image_storage_db;

-- Product Images Table
CREATE TABLE IF NOT EXISTS product_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL COMMENT 'Product ID from farm-production-service',
    farm_id BIGINT NOT NULL COMMENT 'Farm ID',
    file_name VARCHAR(255) NOT NULL COMMENT 'Generated file name',
    original_name VARCHAR(255) COMMENT 'Original file name',
    content_type VARCHAR(100) COMMENT 'MIME type (e.g., image/jpeg)',
    file_size BIGINT COMMENT 'File size in bytes',
    storage_path VARCHAR(500) NOT NULL COMMENT 'Path in storage (S3/MinIO)',
    storage_url VARCHAR(1000) COMMENT 'Public URL or presigned URL',
    status VARCHAR(50) DEFAULT 'ACTIVE' COMMENT 'ACTIVE, DELETED',
    uploaded_by BIGINT COMMENT 'User ID who uploaded',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_product_id (product_id),
    INDEX idx_farm_id (farm_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
