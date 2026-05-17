package com.example.admin_service.service;

import com.example.admin_service.client.FarmServiceClient;
import com.example.admin_service.dto.RoleRequestResponseDTO;
import com.example.admin_service.entity.Role;
import com.example.admin_service.entity.RoleRequest;
import com.example.admin_service.entity.User;
import com.example.admin_service.enums.RequestStatus;
import com.example.admin_service.repository.RoleRepository;  // Thêm import
import com.example.admin_service.repository.RoleRequestRepository;
import com.example.admin_service.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.admin_service.enums.ERole;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RoleApprovalService {

    @Autowired
    private RoleRequestRepository requestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;  // Thêm inject
    
    @Autowired
    private FarmServiceClient farmServiceClient;  // Thêm inject để gọi Farm Service

    // 1. User gửi yêu cầu
    public RoleRequest submitRequest(Long userId, String roleName, String docs) {
        RoleRequest request = new RoleRequest();
        request.setUserId(userId);
        request.setRequestedRoleName(roleName);
        request.setDocumentUrls(docs);
        request.setStatus(RequestStatus.PENDING);
        request.setCreatedAt(LocalDateTime.now());  // Đảm bảo set
        return requestRepository.save(request);
    }

    // 2. Admin lấy danh sách chờ duyệt
    public List<RoleRequestResponseDTO> getPendingRequests() {
        List<RoleRequest> requests = requestRepository.findByStatus(RequestStatus.PENDING);
        
        // Map từ RoleRequest sang RoleRequestResponseDTO, join với User để lấy username và email
        return requests.stream().map(request -> {
            User user = userRepository.findById(request.getUserId()).orElse(null);
            
            RoleRequestResponseDTO dto = new RoleRequestResponseDTO();
            dto.setRequestId(request.getRequestId());
            dto.setUserId(request.getUserId());
            dto.setUserName(user != null ? user.getUsername() : "Unknown");
            dto.setEmail(user != null ? user.getEmail() : "No Email");
            dto.setRequestedRoleName(request.getRequestedRoleName());
            dto.setStatus(request.getStatus());
            dto.setDocumentUrls(request.getDocumentUrls());
            dto.setAdminNote(request.getAdminNote());
            dto.setCreatedAt(request.getCreatedAt());
            dto.setUpdatedAt(request.getUpdatedAt());
            
            return dto;
        }).collect(Collectors.toList());
    }

    // 3. Admin DUYỆT yêu cầu
    @Transactional
    public void approveRequest(Long requestId) {
        // --- BƯỚC 1: Validate Request ---
        RoleRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Request has already been processed");
        }

        // --- BƯỚC 2: Xử lý Logic Role (Fix lỗi tại đây) ---
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Xử lý tên Role để khớp với Database (ví dụ: FARM_MANAGER -> ROLE_FARMMANAGER)
        // Lưu ý: Dựa vào ảnh DB của bạn, tên role viết liền (FARMMANAGER), nên cần remove "_"
        String requestedRoleStr = request.getRequestedRoleName().toUpperCase().replace("_", "");
        String enumName = "ROLE_" + requestedRoleStr;

        // Kiểm tra xem Role mới có tồn tại trong Enum và DB không
        ERole eRole;
        try {
            eRole = ERole.valueOf(enumName);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role name in request: " + request.getRequestedRoleName());
        }

        Role newRole = roleRepository.findByName(eRole)
                .orElseThrow(() -> new RuntimeException("Role not found: " + enumName));

        // --- QUAN TRỌNG: Thay thế Role cũ bằng Role mới ---

        // Cách cũ của bạn: Chỉ xóa GUEST (Sai nếu user đang là role khác muốn đổi)
        // user.getRoles().remove(guestRole);

        // CÁCH MỚI: Xóa toàn bộ role hiện tại của user để đảm bảo user chỉ có 1 role duy nhất mới cấp
        user.getRoles().clear();

        // Thêm role mới vào
        user.getRoles().add(newRole);

        // Lưu User -> Hibernate sẽ tự động update bảng user_roles (xóa dòng cũ, insert dòng mới)
        userRepository.save(user);

        // --- BƯỚC 3: Cập nhật trạng thái Request ---
        request.setStatus(RequestStatus.APPROVED);
        request.setUpdatedAt(LocalDateTime.now());
        requestRepository.save(request);

        // --- BƯỚC 4: Nếu role là FARM_MANAGER, tự động tạo Farm mới cho user ---
        if (eRole == ERole.ROLE_FARMMANAGER) {
            try {
                Map<String, Long> farmRequest = new HashMap<>();
                farmRequest.put("ownerId", user.getId());
                farmServiceClient.createFarmForOwner(farmRequest);
                System.out.println("LOG: Đã tạo farm mới cho user " + user.getId());
            } catch (Exception e) {
                // Log lỗi nhưng không rollback transaction (farm có thể đã tồn tại)
                System.err.println("WARNING: Không thể tạo farm cho user " + user.getId() + ": " + e.getMessage());
            }
        }

        System.out.println("LOG: Đã update user " + user.getId() + " thành role duy nhất: " + enumName);
    }

    // 4. Admin TỪ CHỐI yêu cầu
    public void rejectRequest(Long requestId, String reason) {
        RoleRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        request.setStatus(RequestStatus.REJECTED);
        request.setAdminNote(reason);
        request.setUpdatedAt(LocalDateTime.now());
        requestRepository.save(request);
    }
}