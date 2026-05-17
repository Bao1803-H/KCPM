CREATE TABLE role_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    requested_role_name VARCHAR(50) NOT NULL, -- Ví dụ: 'FARM_OWNER', 'SHIPPER'
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    
    -- Lưu đường dẫn ảnh bằng chứng (Business License)
    -- Có thể lưu JSON nếu nhiều ảnh, hoặc TEXT
    document_urls TEXT, 
    
    -- Lý do từ chối (nếu có)
    admin_note TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Khóa ngoại trỏ về bảng users để biết ai đang xin
    CONSTRAINT fk_request_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);