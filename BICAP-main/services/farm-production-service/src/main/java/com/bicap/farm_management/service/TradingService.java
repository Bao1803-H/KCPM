package com.bicap.farm_management.service;

import com.bicap.farm_management.entity.ExportBatch;
import com.bicap.farm_management.entity.ProductListing;
import com.bicap.farm_management.entity.PurchaseOrder;
import com.bicap.farm_management.repository.ExportBatchRepository;
import com.bicap.farm_management.repository.ProductListingRepository;
import com.bicap.farm_management.repository.PurchaseOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TradingService {
    @Autowired
    private ProductListingRepository listingRepository;
    @Autowired
    private PurchaseOrderRepository orderRepository;
    @Autowired
    private ExportBatchRepository exportBatchRepository;

    // 1. Đăng bán sản phẩm lên sàn
    public ProductListing listProductOnFloor(Long exportBatchId, ProductListing listing) {
        ExportBatch batch = exportBatchRepository.findById(exportBatchId)
                .orElseThrow(() -> new RuntimeException("Lô xuất kho không tồn tại!"));

        listing.setExportBatch(batch);
        listing.setAvailableQuantity(batch.getQuantity()); // Mặc định bán hết số lượng trong lô
        listing.setListedAt(LocalDateTime.now());
        listing.setStatus("ACTIVE");
        
        return listingRepository.save(listing);
    }

    // 2. Retailer tạo đơn đặt hàng (Mua hàng)
    public PurchaseOrder placeOrder(Long listingId, PurchaseOrder order) {
        ProductListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Bài đăng không tồn tại!"));

        if (order.getQuantity() > listing.getAvailableQuantity()) {
            throw new RuntimeException("Số lượng đặt mua vượt quá số lượng còn lại!");
        }

        order.setProductListing(listing);
        order.setOrderDate(LocalDateTime.now());
        order.setStatus("PENDING"); // Đơn hàng mới sẽ ở trạng thái chờ duyệt
        
        // Tính tạm tổng tiền
        if (listing.getPricePerUnit() != null) {
            order.setTotalPrice(order.getQuantity() * listing.getPricePerUnit());
        }

        return orderRepository.save(order);
    }

    // 3. Nông dân duyệt đơn hàng (Đồng ý bán)
    public PurchaseOrder approveOrder(Long orderId) {
        PurchaseOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại!"));
        
        ProductListing listing = order.getProductListing();

        // Trừ số lượng tồn kho
        listing.setAvailableQuantity(listing.getAvailableQuantity() - order.getQuantity());
        if (listing.getAvailableQuantity() <= 0) {
            listing.setStatus("SOLD_OUT");
        }
        listingRepository.save(listing);

        order.setStatus("CONFIRMED");
        return orderRepository.save(order);
    }

    public List<ProductListing> getActiveListings() {
        return listingRepository.findByStatus("ACTIVE");
    }
}