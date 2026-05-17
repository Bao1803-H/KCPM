package com.bicap.blockchain_adapter_service.dto;

public class BlockchainStatsResponse {
    private Long totalRecords;
    private Long recordsToday;
    private String network;

    public BlockchainStatsResponse() {
    }

    public Long getTotalRecords() {
        return totalRecords;
    }

    public void setTotalRecords(Long totalRecords) {
        this.totalRecords = totalRecords;
    }

    public Long getRecordsToday() {
        return recordsToday;
    }

    public void setRecordsToday(Long recordsToday) {
        this.recordsToday = recordsToday;
    }

    public String getNetwork() {
        return network;
    }

    public void setNetwork(String network) {
        this.network = network;
    }
}
