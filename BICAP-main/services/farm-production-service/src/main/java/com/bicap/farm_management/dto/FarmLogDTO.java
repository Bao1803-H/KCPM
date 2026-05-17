package com.bicap.farm_management.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class FarmLogDTO {
    private Long id;            // ID gốc của bản ghi (Batch ID hoặc Export ID)
    private String type;        // Loại: "SẢN XUẤT" hoặc "XUẤT KHẨU"
    private String code;        // Mã lô
    private String description; // Mô tả chi tiết
    private String status;      // Trạng thái (nếu có)
    private LocalDateTime timestamp; // Thời gian thực hiện (để sắp xếp)
}