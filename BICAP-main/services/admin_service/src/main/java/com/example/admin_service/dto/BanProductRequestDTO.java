package com.example.admin_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BanProductRequestDTO {

    @NotBlank(message = "Lý do khóa sản phẩm không được để trống")
    @Size(min = 10, max = 1000, message = "Lý do phải từ 10-1000 ký tự")
    private String reason;
}
