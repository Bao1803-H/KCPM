package com.bicap.farm_management.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageStorageService {

    private final RestTemplate restTemplate;

    @Value("${image.storage.service.url:http://localhost:8086}")
    private String imageStorageServiceUrl;

    public String uploadImage(MultipartFile file, Long productId, Long farmId, String authToken) {
        try {
            String url = imageStorageServiceUrl + "/api/images/upload";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            if (authToken != null && !authToken.isEmpty()) {
                headers.set("Authorization", "Bearer " + authToken);
            }

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", file.getResource());
            body.add("productId", String.valueOf(productId));
            body.add("farmId", String.valueOf(farmId));

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                requestEntity,
                Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                return (String) responseBody.get("imageUrl");
            }
            
            return null;
        } catch (Exception e) {
            log.error("Error uploading image to image-storage-service", e);
            return null;
        }
    }

    public List<Map<String, Object>> getProductImages(Long productId) {
        try {
            String url = imageStorageServiceUrl + "/api/images/product/" + productId;
            ResponseEntity<List> response = restTemplate.getForEntity(url, List.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            
            return List.of();
        } catch (Exception e) {
            log.error("Error fetching product images", e);
            return List.of();
        }
    }
}
