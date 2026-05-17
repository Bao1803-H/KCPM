package com.bicap.farm_management.service;

import com.bicap.farm_management.dto.BlockchainResult;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BlockchainResponseListener {

    @Autowired
    private ProductionBatchService batchService;

    @Autowired
    private FarmingProcessService processService; // ✅ Đã thêm service này vào

    @Autowired
    private ExportBatchService exportBatchService;

    // Chỉ giữ lại DUY NHẤT 1 hàm lắng nghe thôi
    @RabbitListener(queues = "${bicap.rabbitmq.queue.response}")
    public void receiveBlockchainResponse(BlockchainResult result) {
        System.out.println("📩 [RECV] Nhận phản hồi từ Blockchain: " + result);

        if (result.isSuccess()) {
            try {
                Long id = Long.valueOf(result.getResourceId());

                // Logic phân luồng: Cái nào thì gọi service đó
                if ("BATCH".equals(result.getResourceType())) {
                    batchService.updateBlockchainStatus(id, result.getTransactionId());
                } 
                else if ("PROCESS".equals(result.getResourceType())) {
                    processService.updateBlockchainStatus(id, result.getTransactionId());
                }
                else if ("EXPORT".equals(result.getResourceType())) {
                    exportBatchService.updateBlockchainStatus(id, result.getTransactionId());
                }
            } catch (NumberFormatException e) {
                System.err.println("❌ Lỗi ID không hợp lệ: " + result.getResourceId());
            }
        } else {
            System.err.println("❌ Blockchain báo lỗi: " + result.getErrorMessage());
        }
    }
}