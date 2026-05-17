package com.bicap.farm_management.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class BlockchainResult implements Serializable {
    private String resourceId;
    private String resourceType;
    private boolean success;
    private String transactionId; // Hash giao dịch trên Blockchain
    private String errorMessage;
}