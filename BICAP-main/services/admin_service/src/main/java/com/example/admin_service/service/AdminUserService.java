package com.example.admin_service.service;

import com.example.admin_service.dto.UserResponseDTO;
import com.example.admin_service.entity.User;
import com.example.admin_service.enums.UserStatus;
import com.example.admin_service.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    @Autowired
    private UserRepository userRepository;

    // Lấy tất cả User
    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll().stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    // Khóa/Mở khóa User
    public void changeUserStatus(Long userId, UserStatus newStatus) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus(newStatus);
        userRepository.save(user);
    }

    // Helper: Convert Entity sang DTO
    private UserResponseDTO convertToDTO(User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setStatus(user.getStatus());
        dto.setRoles(user.getRoles().stream().map(role -> role.getName().toString()).collect(Collectors.toSet()));
        return dto;
    }
    // Thêm import: Page, Pageable, PageRequest
    public Page<UserResponseDTO> getUsersWithFilter(String keyword, String role, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Specification<User> spec = UserSpecification.filterUsers(keyword, role);

        // Gọi hàm findAll có sẵn nhờ JpaSpecificationExecutor
        Page<User> userPage = userRepository.findAll(spec, pageable);

        // Convert Page<User> sang Page<UserResponseDTO>
        return userPage.map(this::convertToDTO);
    }
}