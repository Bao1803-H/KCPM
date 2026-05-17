-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: bicap_order_db
-- ------------------------------------------------------
-- Server version	8.0.37

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `marketplace_products`
--

DROP TABLE IF EXISTS `marketplace_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `marketplace_products` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `batch_id` bigint NOT NULL COMMENT 'ID lô sản xuất (tham chiếu farm-production-service)',
  `farm_id` bigint NOT NULL COMMENT 'ID trang trại',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tên sản phẩm',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Mô tả sản phẩm',
  `price` decimal(12,2) NOT NULL COMMENT 'Giá bán',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING' COMMENT 'PENDING | APPROVED',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `marketplace_products`
--

LOCK TABLES `marketplace_products` WRITE;
/*!40000 ALTER TABLE `marketplace_products` DISABLE KEYS */;
INSERT INTO `marketplace_products` VALUES (1,101,1,'Organic Rice ST25','High quality organic rice from Mekong Delta',18000.00,'APPROVED','2025-12-23 15:37:20'),(2,102,1,'Clean Mango','Naturally grown mango, no chemicals',25000.00,'APPROVED','2025-12-23 15:37:20'),(3,103,2,'Organic Coffee Beans','Arabica coffee beans from Central Highlands',95000.00,'PENDING','2025-12-23 15:37:20');
/*!40000 ALTER TABLE `marketplace_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_feedbacks`
--

DROP TABLE IF EXISTS `order_feedbacks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_feedbacks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL COMMENT 'ID đơn hàng',
  `rating` int DEFAULT NULL COMMENT 'Điểm đánh giá (1-5)',
  `comment` text COLLATE utf8mb4_unicode_ci COMMENT 'Nhận xét',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `order_feedbacks_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_feedbacks`
--

LOCK TABLES `order_feedbacks` WRITE;
/*!40000 ALTER TABLE `order_feedbacks` DISABLE KEYS */;
INSERT INTO `order_feedbacks` VALUES (1,3,5,'Products are fresh and delivered on time','2025-12-23 15:38:01'),(2,2,4,'Good quality, packaging could be improved','2025-12-23 15:38:01');
/*!40000 ALTER TABLE `order_feedbacks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL COMMENT 'ID đơn hàng',
  `product_id` bigint NOT NULL COMMENT 'ID sản phẩm marketplace',
  `quantity` int NOT NULL COMMENT 'Số lượng',
  `unit_price` decimal(12,2) NOT NULL COMMENT 'Đơn giá tại thời điểm mua',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,1,10,18000.00),(2,1,2,5,25000.00),(3,2,2,20,25000.00),(4,3,3,10,95000.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `buyer_id` bigint NOT NULL COMMENT 'ID người mua (Retailer)',
  `total_amount` decimal(14,2) NOT NULL COMMENT 'Tổng giá trị đơn hàng',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'CREATED' COMMENT 'CREATED | CONFIRMED | REJECTED | COMPLETED',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,10,430000.00,'CREATED','2025-12-23 15:37:42'),(2,11,1800000.00,'CONFIRMED','2025-12-23 15:37:42'),(3,12,950000.00,'COMPLETED','2025-12-23 15:37:42');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-23 22:42:03
-- 1. TẠO BẢNG DANH MỤC (Mới)
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tên danh mục (Vd: Rau ăn lá)',
  `description` text COLLATE utf8mb4_unicode_ci,
  `icon_url` varchar(255) COLLATE utf8mb4_unicode_ci COMMENT 'Link ảnh icon',
  `is_active` boolean DEFAULT true COMMENT 'Trạng thái hiển thị',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CẬP NHẬT BẢNG SẢN PHẨM
-- Thêm các cột cần thiết cho việc hiển thị và quản lý
ALTER TABLE `marketplace_products`
ADD COLUMN `category_id` bigint COMMENT 'FK to categories',
ADD COLUMN `image_url` varchar(500) COLLATE utf8mb4_unicode_ci COMMENT 'Link ảnh chính sản phẩm',
ADD COLUMN `stock_quantity` int DEFAULT 0 COMMENT 'Số lượng tồn kho',
ADD COLUMN `ban_reason` text COLLATE utf8mb4_unicode_ci COMMENT 'Lý do Admin khóa sản phẩm (nếu có)';

-- Thêm khóa ngoại (Foreign Key)
ALTER TABLE `marketplace_products`
ADD CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

-- QUAN TRỌNG: Sửa trạng thái mặc định thành ACTIVE (Đăng là bán luôn)
ALTER TABLE `marketplace_products`
MODIFY COLUMN `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE' COMMENT 'ACTIVE | BANNED | OUT_OF_STOCK';

-- 3. CẬP NHẬT BẢNG ĐƠN HÀNG (Để Admin dễ quản lý dòng tiền)
ALTER TABLE `orders`
ADD COLUMN `payment_method` varchar(50) DEFAULT 'COD' COMMENT 'COD | BANK_TRANSFER',
ADD COLUMN `payment_status` varchar(50) DEFAULT 'UNPAID' COMMENT 'UNPAID | PAID | REFUNDED';