package com.bicap.trading_order_service.service.impl;

import com.bicap.trading_order_service.dto.ProductResponseDTO;
import com.bicap.trading_order_service.dto.BanProductRequestDTO;
import com.bicap.trading_order_service.entity.FarmManager;
import com.bicap.trading_order_service.entity.MarketplaceProduct;
import com.bicap.trading_order_service.exception.repository.CategoryRepository;
import com.bicap.trading_order_service.exception.repository.MarketplaceProductRepository;
import com.bicap.trading_order_service.service.IProductService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProductServiceImpl implements IProductService {

    private final MarketplaceProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductServiceImpl(MarketplaceProductRepository productRepository,
                                   CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponseDTO> getProductsWithFilter(String keyword, String status, Long farmId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<MarketplaceProduct> productPage = productRepository.findWithFilters(keyword, status, farmId, pageable);
        
        return productPage.map(this::mapToDTO);
    }

    @Override
    @Transactional
    public ProductResponseDTO banProduct(Long productId, BanProductRequestDTO request) {
        MarketplaceProduct product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + productId));

        // Kiểm tra nếu sản phẩm đã bị ban
        if ("BANNED".equals(product.getStatus())) {
            throw new RuntimeException("Sản phẩm đã bị khóa trước đó");
        }

        product.setStatus("BANNED");
        product.setBanReason(request.getReason());

        MarketplaceProduct savedProduct = productRepository.save(product);
        return mapToDTO(savedProduct);
    }

    @Override
    @Transactional
    public ProductResponseDTO unbanProduct(Long productId) {
        MarketplaceProduct product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + productId));

        // Kiểm tra nếu sản phẩm chưa bị ban
        if (!"BANNED".equals(product.getStatus())) {
            throw new RuntimeException("Sản phẩm không ở trạng thái bị khóa");
        }

        product.setStatus("ACTIVE");
        product.setBanReason(null); // Xóa lý do ban

        MarketplaceProduct savedProduct = productRepository.save(product);
        return mapToDTO(savedProduct);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponseDTO getProductById(Long productId) {
        MarketplaceProduct product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + productId));
        return mapToDTO(product);
    }

    @Override
    public long countByStatus(String status) {
        return productRepository.countByStatus(status);
    }

    /**
     * Map entity sang DTO với thông tin Farm/User
     */
    private ProductResponseDTO mapToDTO(MarketplaceProduct product) {
        ProductResponseDTO.ProductResponseDTOBuilder builder = ProductResponseDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .category(product.getCategory())
                .description(product.getDescription())
                .quantity(product.getQuantity())
                .unit(product.getUnit())
                .price(product.getPrice())
                .imageUrl(product.getImageUrl())
                .status(product.getStatus())
                .batchId(product.getBatchId())
                .createdAt(product.getCreatedAt())
                .banReason(product.getBanReason())
                .categoryId(product.getCategoryId())
                .stockQuantity(product.getStockQuantity());

        // Lấy thông tin FarmManager
        FarmManager farmManager = product.getFarmManager();
        if (farmManager != null) {
            builder.farmId(farmManager.getFarmId())
                   .farmManagerId(farmManager.getId())
                   .farmManagerUsername(farmManager.getUsername())
                   .farmManagerEmail(farmManager.getEmail())
                   .ownerName(farmManager.getUsername())
                   .farmName(farmManager.getUsername() + "'s Farm");
        }

        // Lấy tên Category nếu có
        if (product.getCategoryId() != null) {
            categoryRepository.findById(product.getCategoryId())
                    .ifPresent(category -> builder.categoryName(category.getName()));
        }

        return builder.build();
    }
}
