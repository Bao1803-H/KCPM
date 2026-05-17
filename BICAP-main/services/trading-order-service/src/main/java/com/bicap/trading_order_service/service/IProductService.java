package com.bicap.trading_order_service.service;

import com.bicap.trading_order_service.dto.ProductResponseDTO;
import com.bicap.trading_order_service.dto.BanProductRequestDTO;
import org.springframework.data.domain.Page;

public interface IProductService {

    /**
     * Lấy danh sách sản phẩm với bộ lọc (dành cho Admin)
     * @param keyword Từ khóa tìm kiếm theo tên sản phẩm
     * @param status Trạng thái sản phẩm (ACTIVE/BANNED/OUT_OF_STOCK)
     * @param farmId ID trang trại
     * @param page Số trang
     * @param size Số lượng mỗi trang
     * @return Page<AdminProductResponseDTO>
     */
    Page<ProductResponseDTO> getProductsWithFilter(String keyword, String status, Long farmId, int page, int size);

    /**
     * Khóa sản phẩm (Ban)
     * @param productId ID sản phẩm
     * @param request Lý do khóa
     * @return AdminProductResponseDTO
     */
    ProductResponseDTO banProduct(Long productId, BanProductRequestDTO request);

    /**
     * Mở khóa sản phẩm (Unban)
     * @param productId ID sản phẩm
     * @return AdminProductResponseDTO
     */
    ProductResponseDTO unbanProduct(Long productId);

    /**
     * Lấy chi tiết sản phẩm theo ID (Admin view)
     * @param productId ID sản phẩm
     * @return AdminProductResponseDTO
     */
    ProductResponseDTO getProductById(Long productId);

    /**
     * Đếm số sản phẩm theo status
     * @param status Trạng thái
     * @return Số lượng
     */
    long countByStatus(String status);
}
