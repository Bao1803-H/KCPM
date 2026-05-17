package com.bicap.blockchain_adapter_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BlockchainMessage implements Serializable {
    private String resourceId;    // ID của Lô sản xuất hoặc Quy trình
    private String resourceType;  // "BATCH" hoặc "PROCESS"
    private String dataHash;      // Mã Hash dữ liệu
    private String timestamp;
}
