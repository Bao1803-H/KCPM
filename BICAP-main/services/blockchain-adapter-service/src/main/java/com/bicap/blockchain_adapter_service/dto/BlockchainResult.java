package com.bicap.blockchain_adapter_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BlockchainResult implements Serializable {
    private String resourceId;
    private String resourceType;
    private boolean success;
    private String transactionId;
    private String errorMessage;
}
