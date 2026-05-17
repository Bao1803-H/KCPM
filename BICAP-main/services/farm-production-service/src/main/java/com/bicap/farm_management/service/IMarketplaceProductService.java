package com.bicap.farm_management.service;


import java.util.List;

import com.bicap.farm_management.dto.CreateMarketplaceProductRequest;
import com.bicap.farm_management.dto.ProductResponse;
import com.bicap.farm_management.dto.UpdateMarketplaceProductRequest;
import com.bicap.farm_management.entity.MarketplaceProduct;

public interface IMarketplaceProductService {

    MarketplaceProduct createProduct(CreateMarketplaceProductRequest request);

    List<ProductResponse> getApprovedProducts();
    ProductResponse getProductDetail(Long productId);
    List<ProductResponse> getProductsByFarm(Long farmId);
    List<ProductResponse> getPendingProducts();

    MarketplaceProduct updateProduct(Long productId, UpdateMarketplaceProductRequest request);
    MarketplaceProduct approveProduct(Long productId);
    MarketplaceProduct getProductById(Long productId);

    void deleteProduct(Long productId);
}