package com.bicap.farm_management.service.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bicap.farm_management.dto.CreateMarketplaceProductRequest;
import com.bicap.farm_management.dto.ProductResponse;
import com.bicap.farm_management.dto.UpdateMarketplaceProductRequest;
import com.bicap.farm_management.entity.ExportBatch;
import com.bicap.farm_management.entity.Farm;
import com.bicap.farm_management.entity.MarketplaceProduct;
import com.bicap.farm_management.repository.ExportBatchRepository;
import com.bicap.farm_management.repository.FarmRepository;
import com.bicap.farm_management.repository.MarketplaceProductRepository;
import com.bicap.farm_management.service.IMarketplaceProductService;
import com.bicap.farm_management.service.ProductProducerMQ;
import com.bicap.farm_management.service.exception.ProductNotFoundException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MarketplaceProductServiceImpl implements IMarketplaceProductService {

    private static final Logger LOGGER = LoggerFactory.getLogger(MarketplaceProductServiceImpl.class);

    @Autowired
    private final MarketplaceProductRepository repository;

    @Autowired
    private final FarmRepository farmRepository;

    @Autowired
    private final ProductProducerMQ productProducerMQ;

    @Autowired
    private final ExportBatchRepository exportBatchRepository;

    
    public MarketplaceProductServiceImpl(MarketplaceProductRepository repository, FarmRepository farmRepository, ProductProducerMQ productProducerMQ, ExportBatchRepository exportBatchRepository) {
        this.repository = repository;
        this.farmRepository = farmRepository;
        this.productProducerMQ = productProducerMQ;
        this.exportBatchRepository = exportBatchRepository;
    }

    @Override
    public MarketplaceProduct createProduct(CreateMarketplaceProductRequest request) {
        LOGGER.info("Creating product for Farm ID: {}", request.getFarmId());
        Farm farm = farmRepository.findById(request.getFarmId())
            .orElseThrow(() -> new RuntimeException("Farm not found with ID: " + request.getFarmId()));

        ExportBatch exportBatch = exportBatchRepository.findById(request.getExportBatchId())
            .orElseThrow(() -> new RuntimeException("Export Batch not found."));
        
        // Create new product saved to it owns database
        MarketplaceProduct product = new MarketplaceProduct();
        product.setExportBatch(exportBatch);
        product.setFarm(farm);
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setUnit(request.getUnit());
        product.setQuantity(request.getQuantity());
        product.setCategory(request.getCategory());
        product.setImageUrl(request.getImageUrl());
        product.setStatus("PENDING");
        product.setCreatedAt(LocalDateTime.now());

        // Store first (so we can safely reference exportBatch + other fields)
        MarketplaceProduct saved = repository.save(product);

        // Send message to the trading order service
        Map<String, Object> dataProduct = new HashMap<>();
        dataProduct.put("farmId", saved.getFarm().getId());
        dataProduct.put("farmName", saved.getFarm().getFarmName());
        dataProduct.put("name", saved.getName());
        dataProduct.put("description", saved.getDescription());
        dataProduct.put("unit", saved.getUnit());
        dataProduct.put("price", saved.getPrice());
        dataProduct.put("quantity", saved.getQuantity());
        dataProduct.put("category", saved.getCategory());
        dataProduct.put("imageUrl", saved.getImageUrl());
        // Correlation key for upsert on trading side
        dataProduct.put("batchId", saved.getExportBatch() != null ? saved.getExportBatch().getBatchCode() : null);

        LOGGER.info("Sending message to trading-order-service for product: {}", saved.getName());
        productProducerMQ.sendMessageToTradingOrderService("CREATED_PRODUCT", dataProduct);

        return saved;
    }

    @Override
    public List<ProductResponse> getApprovedProducts() {
        return repository.findAll().stream()
            .filter(p -> "APPROVED".equals(p.getStatus()))
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Override
    public ProductResponse getProductDetail(Long productId) {
        MarketplaceProduct product = repository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException("Product not found with ID: " + productId));
        return mapToResponse(product);
    }

    @Override
    public List<ProductResponse> getProductsByFarm(Long farmId) {
        return repository.findByFarmId(farmId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Override
    public List<ProductResponse> getPendingProducts() {
        return repository.findAll().stream()
            .filter(p -> "PENDING".equals(p.getStatus()))
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Override
    public MarketplaceProduct updateProduct(Long productId, UpdateMarketplaceProductRequest request) {
        MarketplaceProduct product = repository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException("Product not found with ID: " + productId));
        
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setUnit(request.getUnit());
        product.setQuantity(request.getQuantity());
        product.setCategory(request.getCategory());
        product.setImageUrl(request.getImageUrl());

        MarketplaceProduct saved = repository.save(product);

        // Broadcast update (especially imageUrl updates after upload)
        try {
            Map<String, Object> dataProduct = new HashMap<>();
            dataProduct.put("farmId", saved.getFarm() != null ? saved.getFarm().getId() : null);
            dataProduct.put("farmName", saved.getFarm() != null ? saved.getFarm().getFarmName() : null);
            dataProduct.put("name", saved.getName());
            dataProduct.put("description", saved.getDescription());
            dataProduct.put("unit", saved.getUnit());
            dataProduct.put("price", saved.getPrice());
            dataProduct.put("quantity", saved.getQuantity());
            dataProduct.put("category", saved.getCategory());
            dataProduct.put("imageUrl", saved.getImageUrl());
            dataProduct.put("batchId", saved.getExportBatch() != null ? saved.getExportBatch().getBatchCode() : null);

            productProducerMQ.sendMessageToTradingOrderService("UPDATED_PRODUCT", dataProduct);
        } catch (Exception e) {
            LOGGER.warn("Failed to broadcast UPDATED_PRODUCT for id={}: {}", productId, e.getMessage());
        }

        return saved;
    }

    @Override
    public MarketplaceProduct approveProduct(Long productId) {
        MarketplaceProduct product = repository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException("Product not found with ID: " + productId));
        product.setStatus("APPROVED");
        return repository.save(product);
    }

    @Override
    public MarketplaceProduct getProductById(Long productId) {
        return repository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException("Product not found with ID: " + productId));
    }

    @Override
    public void deleteProduct(Long productId) {
        MarketplaceProduct product = repository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException("Product not found with ID: " + productId));
        repository.delete(product);
    }

    private ProductResponse mapToResponse(MarketplaceProduct product) {
        ProductResponse response = new ProductResponse();
        response.setId(product.getId());
        response.setFarmId(product.getFarm().getId());
        response.setName(product.getName());
        response.setDescription(product.getDescription());
        response.setPrice(product.getPrice());
        response.setUnit(product.getUnit());
        response.setQuantity(product.getQuantity());
        response.setCategory(product.getCategory());
        response.setImageUrl(product.getImageUrl());
        response.setStatus(product.getStatus());
        response.setCreatedAt(product.getCreatedAt());
        return response;
    }
}