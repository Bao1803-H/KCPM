package com.bicap.farm_management.controller;

import com.bicap.farm_management.entity.ProductListing;
import com.bicap.farm_management.entity.PurchaseOrder;
import com.bicap.farm_management.service.TradingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trading")
@CrossOrigin(origins = "*")
public class TradingController {

    @Autowired
    private TradingService tradingService;

    // 1. Nông dân: Đăng bán lô hàng (POST /api/trading/list/{exportBatchId})
    @PostMapping("/list/{exportBatchId}")
    public ResponseEntity<ProductListing> listProduct(
            @PathVariable Long exportBatchId, 
            @RequestBody ProductListing listing) {
        return ResponseEntity.ok(tradingService.listProductOnFloor(exportBatchId, listing));
    }

    // 2. Retailer: Xem danh sách đang bán (GET /api/trading/listings)
    @GetMapping("/listings")
    public List<ProductListing> getListings() {
        return tradingService.getActiveListings();
    }

    // 3. Retailer: Đặt mua hàng (POST /api/trading/order/{listingId})
    @PostMapping("/order/{listingId}")
    public ResponseEntity<PurchaseOrder> placeOrder(
            @PathVariable Long listingId, 
            @RequestBody PurchaseOrder order) {
        return ResponseEntity.ok(tradingService.placeOrder(listingId, order));
    }

    // 4. Nông dân: Duyệt đơn hàng (PUT /api/trading/approve-order/{orderId})
    @PutMapping("/approve-order/{orderId}")
    public ResponseEntity<PurchaseOrder> approveOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(tradingService.approveOrder(orderId));
    }
}