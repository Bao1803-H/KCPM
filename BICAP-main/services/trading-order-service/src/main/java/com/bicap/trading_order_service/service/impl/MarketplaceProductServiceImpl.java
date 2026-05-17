package com.bicap.trading_order_service.service.impl;

import com.bicap.trading_order_service.dto.CreateMarketplaceProductRequest;
import com.bicap.trading_order_service.dto.ProductResponse;
import com.bicap.trading_order_service.entity.FarmManager;
import com.bicap.trading_order_service.entity.MarketplaceProduct;
import com.bicap.trading_order_service.exception.repository.FarmManagerRepository;
import com.bicap.trading_order_service.exception.repository.MarketplaceProductRepository;
import com.bicap.trading_order_service.service.IMarketplaceProductService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class MarketplaceProductServiceImpl implements IMarketplaceProductService {

    private final MarketplaceProductRepository repository;
    private final FarmManagerRepository farmManagerRepository;

    public MarketplaceProductServiceImpl(MarketplaceProductRepository repository, FarmManagerRepository farmManagerRepository) {
        this.repository = repository;
        this.farmManagerRepository = farmManagerRepository;
    }

    @Override
    @Transactional
    public MarketplaceProduct createProduct(CreateMarketplaceProductRequest request) {
        MarketplaceProduct product = new MarketplaceProduct();
        product.setName(request.getName());
        product.setCategory(request.getCategory());
        product.setDescription(request.getDescription());
        product.setQuantity(request.getQuantity());
        product.setUnit(request.getUnit());
        product.setPrice(request.getPrice());
        product.setImageUrl(request.getImageUrl());
        FarmManager farmManager = farmManagerRepository.findByFarmId(request.getFarmId())
                .orElseThrow(() -> new RuntimeException("FarmManager not found with farmId: " + request.getFarmId()));
        product.setFarmManager(farmManager);
        product.setBatchId(request.getBatchId());
        product.setStatus("PENDING");
        product.setCreatedAt(LocalDateTime.now());
        return repository.save(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getApprovedProducts() {
        return repository.findAll().stream()
                .filter(p -> "APPROVED".equals(p.getStatus()))
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getProductsByFarm(Long farmId) {
        return repository.findByFarmId(farmId).stream()
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductDetail(Long id) {
        return repository.findById(id)
                .map(this::mapToProductResponse)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    private ProductResponse mapToProductResponse(MarketplaceProduct product) {
        ProductResponse response = new ProductResponse();
        response.setId(product.getId());
        response.setName(product.getName());
        response.setCategory(product.getCategory());
        response.setPrice(product.getPrice());
        response.setUnit(product.getUnit());
        response.setQuantity(product.getQuantity());
        response.setImageUrl(product.getImageUrl());
        response.setStatus(product.getStatus());
        response.setCreatedAt(product.getCreatedAt());
        response.setFarmId(product.getFarmId());
        response.setBatchId(product.getBatchId());
        response.setDescription(product.getDescription());
        // Map isApproved boolean if needed by frontend logic, usually derived from status
        response.setIsApproved("APPROVED".equals(product.getStatus()));
        return response;
    }

    //search
    @Override
    public List<MarketplaceProduct> searchByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return repository.findAll();
        }
        return repository.findByNameContainingIgnoreCase(name.trim());
    }

    @Override
    public List<ProductResponse> searchApprovedByName(String keyword) {
        List<MarketplaceProduct> products = searchByName(keyword);
        return products.stream()
                .filter(p -> "APPROVED".equals(p.getStatus()))
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());
    }
}
