# Image Storage Service - BICAP

## Overview

The Image Storage Service is a microservice designed to handle product image uploads, storage, and retrieval for agricultural products in the BICAP system. It uses MinIO (S3-compatible object storage) for storing images and provides REST APIs for image management.

## Features

- ✅ **Image Upload**: Farm managers can upload product images
- ✅ **Image Storage**: Images are stored in MinIO (S3-compatible) object storage
- ✅ **Image Retrieval**: Public access to product images for clients and admins
- ✅ **Image Management**: View, delete, and manage product images
- ✅ **Database Tracking**: Metadata stored in MySQL database

## Architecture

### Components

1. **Image Storage Service** (Port 8086)
   - Spring Boot microservice
   - Handles image upload/download
   - Manages image metadata

2. **MinIO** (Ports 9000, 9001)
   - S3-compatible object storage
   - Stores actual image files
   - Access via MinIO Console: http://localhost:9001

3. **Image Storage Database** (Port 3312)
   - MySQL database
   - Stores image metadata (file paths, URLs, product associations)

## API Endpoints

### Upload Image
```
POST /api/images/upload
Content-Type: multipart/form-data

Parameters:
- file: MultipartFile (image file)
- productId: Long
- farmId: Long

Authorization: Bearer <token> (ROLE_FARMMANAGER or ROLE_ADMIN)
```

### Get Product Images
```
GET /api/images/product/{productId}

Response: List of image objects with URLs
```

### Get Image URL
```
GET /api/images/{imageId}/url

Response: Image URL (presigned URL from MinIO)
```

### Get Image File
```
GET /api/images/{imageId}

Response: Image file stream
```

### Delete Image
```
DELETE /api/images/{imageId}

Authorization: Bearer <token> (ROLE_FARMMANAGER or ROLE_ADMIN)
```

## Integration

### Farm Production Service Integration

Farm managers can upload images when creating/updating products:

```java
POST /api/marketplace-products/{productId}/images
Content-Type: multipart/form-data

Parameters:
- file: MultipartFile
- farmId: Long
```

The service automatically:
1. Uploads image to MinIO via Image Storage Service
2. Updates product's `imageUrl` field
3. Stores image metadata in database

### Admin Service Integration

Admins can view product images when reviewing products:
- Images are accessible via `/api/images/product/{productId}`
- Image URLs are included in product responses

### Client/Trading Order Service Integration

Clients can view product images:
- Images are publicly accessible (no authentication required for viewing)
- Image URLs are included in marketplace product listings

## Configuration

### Environment Variables

```properties
# Image Storage Service
IMAGE_STORAGE_SERVICE_URL=http://image-storage-service:8086

# MinIO Configuration
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
STORAGE_BUCKET_NAME=bicap-product-images

# Database
SPRING_DATASOURCE_URL=jdbc:mysql://image-storage-db:3306/image_storage_db
```

## Database Schema

### product_images Table

```sql
CREATE TABLE product_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    content_type VARCHAR(100),
    file_size BIGINT,
    storage_path VARCHAR(500) NOT NULL,
    storage_url VARCHAR(1000),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    uploaded_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Usage Examples

### Upload Image (Farm Manager)

```bash
curl -X POST http://localhost:8000/api/images/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@product-image.jpg" \
  -F "productId=1" \
  -F "farmId=1"
```

### Get Product Images

```bash
curl http://localhost:8000/api/images/product/1
```

### Get Image URL

```bash
curl http://localhost:8000/api/images/1/url
```

## MinIO Console Access

- **URL**: http://localhost:9001
- **Username**: minioadmin
- **Password**: minioadmin

## Security

- **Upload/Delete**: Requires authentication (ROLE_FARMMANAGER or ROLE_ADMIN)
- **View**: Public access (no authentication required)
- **JWT Token**: Validated using shared secret key

## File Storage Structure

Images are stored in MinIO with the following structure:
```
bicap-product-images/
  └── products/
      └── {productId}/
          └── {uuid}.{extension}
```

## Future Enhancements

- [ ] Image resizing/optimization
- [ ] Multiple image support per product
- [ ] Image compression
- [ ] CDN integration
- [ ] AWS S3 support (production)
- [ ] Azure Blob Storage support

## Troubleshooting

### MinIO Connection Issues
- Check if MinIO container is running: `docker ps | grep minio`
- Verify MinIO endpoint in application.properties
- Check network connectivity between services

### Image Upload Fails
- Verify file size (max 10MB)
- Check content type (must be image/*)
- Ensure authentication token is valid
- Check MinIO bucket exists

### Image Not Accessible
- Verify presigned URL generation
- Check MinIO bucket policy (should allow GET)
- Verify image status is ACTIVE in database
