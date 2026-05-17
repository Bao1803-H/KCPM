package com.bicap.shipping_manager_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor 
public class WriteBlockchainRequest {
    private Long batchId;
    private String rawData;
}