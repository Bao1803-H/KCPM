package com.bicap.trading_order_service.service;

import com.bicap.trading_order_service.dto.CreateMarketplaceProductRequest;
import com.bicap.trading_order_service.dto.ProductResponse;
import com.bicap.trading_order_service.entity.MarketplaceProduct;

import java.util.List;

public interface IMarketplaceProductService {
    MarketplaceProduct createProduct(CreateMarketplaceProductRequest request);
    List<ProductResponse> getApprovedProducts();
    List<ProductResponse> getProductsByFarm(Long farmId);
    ProductResponse getProductDetail(Long id);

    List<MarketplaceProduct> searchByName(String keyword);
    List<ProductResponse> searchApprovedByName(String keyword);
}
