package com.bicap.blockchain_adapter_service.dto;

public class WriteBlockchainRequest {

    private Long batchId;
    private String rawData;

    public WriteBlockchainRequest() {
    }

    public Long getBatchId() {
        return batchId;
    }

    public void setBatchId(Long batchId) {
        this.batchId = batchId;
    }

    public String getRawData() {
        return rawData;
    }

    public void setRawData(String rawData) {
        this.rawData = rawData;
    }
}
