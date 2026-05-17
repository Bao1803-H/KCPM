package com.bicap.shipping_manager_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "drivers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Driver {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String phone;
    private String license; // Giấy phép lái xe
    
    @Column(unique = true)
    private String citizenId; // Số căn cước công dân (CMND/CCCD)
    
    @Column(unique = true)
    private String email; // Email để liên kết với tài khoản Auth Service
    
    // ID người dùng từ Auth Service (để tài xế đăng nhập App)
    private Long userId; 
}
