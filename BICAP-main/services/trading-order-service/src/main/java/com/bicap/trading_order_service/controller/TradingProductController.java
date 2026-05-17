package com.bicap.trading_order_service.controller;

import com.bicap.trading_order_service.dto.ProductResponse;
import com.bicap.trading_order_service.service.IMarketplaceProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trading/products")
public class TradingProductController {

    private final IMarketplaceProductService productService;

    public TradingProductController(IMarketplaceProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/farm/{farmId}")
    public ResponseEntity<List<ProductResponse>> getProductsByFarm(@PathVariable Long farmId) {
        return ResponseEntity.ok(productService.getProductsByFarm(farmId));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductDetail(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductDetail(id));
    }
}
