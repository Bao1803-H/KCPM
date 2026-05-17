package com.bicap.blockchain_adapter_service.config;

import com.bicap.blockchain_adapter_service.dto.BlockchainMessage;
import com.bicap.blockchain_adapter_service.dto.BlockchainResult;
import com.bicap.blockchain_adapter_service.service.IBlockchainService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class BlockchainEventListener {

    private static final Logger logger = LoggerFactory.getLogger(BlockchainEventListener.class);

    private final IBlockchainService blockchainService;
    private final RabbitTemplate rabbitTemplate;

    // Lấy tên Exchange và Routing Key từ file cấu hình để gửi phản hồi
    @Value("${bicap.rabbitmq.exchange}")
    private String exchange;

    @Value("${bicap.rabbitmq.routing-key.response}")
    private String responseRoutingKey;

    public BlockchainEventListener(IBlockchainService blockchainService, RabbitTemplate rabbitTemplate) {
        this.blockchainService = blockchainService;
        this.rabbitTemplate = rabbitTemplate;
    }

    // Lắng nghe yêu cầu từ Farm Service
    @RabbitListener(queues = "${bicap.rabbitmq.queue.request}")
    public void receiveMessage(BlockchainMessage message) {
        logger.info("⚡️ [RECV] Nhận yêu cầu ghi Blockchain. ID: {}, Hash: {}", 
                     message.getResourceId(), message.getDataHash());

        BlockchainResult result = new BlockchainResult();
        result.setResourceId(message.getResourceId());
        result.setResourceType(message.getResourceType());

        try {
            // 1. Ghi dữ liệu lên Blockchain (Giả lập hoặc thật)
            Long id;
            try {
                id = Long.valueOf(message.getResourceId());
            } catch (NumberFormatException nfe) {
                logger.error("❌ [FAIL] Invalid Resource ID format: {}", message.getResourceId());
                return; // Stop processing this message, do not send error response to avoid loops if ID is bad
            }

            // Use the resourceType from the message (BATCH, PROCESS, or EXPORT)
            String resourceType = message.getResourceType() != null ? message.getResourceType() : "BATCH";
            blockchainService.write(id, resourceType, message.getDataHash());
            
            // 2. Tạo kết quả THÀNH CÔNG
            // Giả lập Transaction Hash (Trong thực tế sẽ lấy từ blockchainService.write trả về)
            String txHash = "0x" + message.getDataHash().substring(0, 15) + "..."; 
            
            result.setSuccess(true);
            result.setTransactionId(txHash);
            
            logger.info("✅ [DONE] Ghi thành công. Gửi phản hồi về Farm Service...");

        } catch (Exception e) {
            logger.error("❌ [FAIL] Lỗi xử lý: {}", e.getMessage());
            result.setSuccess(false);
            result.setErrorMessage(e.getMessage());
        }

        // 3. Gửi phản hồi về Farm Service để cập nhật trạng thái
        rabbitTemplate.convertAndSend(exchange, responseRoutingKey, result);
    }
}