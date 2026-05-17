package com.bicap.trading_order_service.dto;

import java.util.List;

public class ConfirmDeliveryRequest {
    private List<String> imageUrls; // List of image URLs uploaded by retailer

    public ConfirmDeliveryRequest() {
    }

    public ConfirmDeliveryRequest(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }
}
