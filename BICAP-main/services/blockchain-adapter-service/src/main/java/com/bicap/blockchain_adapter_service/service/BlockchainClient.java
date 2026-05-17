package com.bicap.blockchain_adapter_service.service;

import org.springframework.stereotype.Component;

@Component
public class BlockchainClient {

    /**
     * MOCK: ghi hash dữ liệu lên blockchain
     * @param hash dữ liệu đã hash
     * @return mock transaction hash (an toàn, không gây lỗi)
     */
    public String writeHash(String hash) {

        if (hash == null || hash.isBlank()) {
            return "MOCK_TX_EMPTY_HASH";
        }

        // Lấy tối đa 10 ký tự đầu, tránh StringIndexOutOfBoundsException
        int length = Math.min(hash.length(), 10);
        return "MOCK_TX_" + hash.substring(0, length);
    }

    /**
     * MOCK: verify dữ liệu blockchain
     * @param hash dữ liệu đã hash
     * @return luôn hợp lệ
     */
    public boolean verifyHash(String hash) {
        // Giả lập verify luôn đúng
        return true;
    }
}
