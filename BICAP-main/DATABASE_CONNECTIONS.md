# THÔNG TIN KẾT NỐI MYSQL CHO TẤT CẢ DATABASES

## 📋 TỔNG QUAN

Hệ thống BICAP sử dụng 5 databases MySQL riêng biệt:
1. **auth-db** - Database cho Auth Service và Admin Service
2. **farm-production-db** - Database cho Farm Production Service
3. **trading-order-db** - Database cho Trading Order Service
4. **shipping-db** - Database cho Shipping Manager Service
5. **blockchain-db** - Database cho Blockchain Adapter Service

---

## 1. AUTH DATABASE (bicap_auth_db)

### Thông tin Database:
- **Database Name:** `bicap_auth_db`
- **Container Name:** `auth-db`
- **Host Port:** `3307`
- **Container Port:** `3306`
- **Username:** `root`
- **Password:** `root`

### Kết nối từ Docker (trong cùng network):
```properties
spring.datasource.url=jdbc:mysql://auth-db:3306/bicap_auth_db
spring.datasource.username=root
spring.datasource.password=root
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

### Kết nối từ Localhost:
```properties
spring.datasource.url=jdbc:mysql://localhost:3307/bicap_auth_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

### Services sử dụng:
- ✅ **auth-service** (port 8080/8088)
- ✅ **admin-service** (port 8085)

### File cấu hình:
- `services/auth-service/src/main/resources/application.properties`
- `services/admin_service/src/main/resources/application.properties`

---

## 2. FARM PRODUCTION DATABASE (farm_production_db)

### Thông tin Database:
- **Database Name:** `farm_production_db`
- **Container Name:** `farm-production-db`
- **Host Port:** `3308`
- **Container Port:** `3306`
- **Username:** `root`
- **Password:** `root`

### Kết nối từ Docker (trong cùng network):
```properties
spring.datasource.url=jdbc:mysql://farm-production-db:3306/farm_production_db
spring.datasource.username=root
spring.datasource.password=root
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

### Kết nối từ Localhost:
```properties
spring.datasource.url=jdbc:mysql://localhost:3308/farm_production_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

### Services sử dụng:
- ✅ **farm-production-service** (port 8081)

### File cấu hình:
- `services/farm-production-service/src/main/resources/application.properties`

---

## 3. TRADING ORDER DATABASE (bicap_order_db)

### Thông tin Database:
- **Database Name:** `bicap_order_db`
- **Container Name:** `trading-order-db`
- **Host Port:** `3309`
- **Container Port:** `3306`
- **Username:** `root`
- **Password:** `root`

### Kết nối từ Docker (trong cùng network):
```properties
spring.datasource.url=jdbc:mysql://trading-order-db:3306/bicap_order_db
spring.datasource.username=root
spring.datasource.password=root
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

### Kết nối từ Localhost:
```properties
spring.datasource.url=jdbc:mysql://localhost:3309/bicap_order_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh
spring.datasource.username=root
spring.datasource.password=root
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

### Services sử dụng:
- ✅ **trading-order-service** (port 8082)

### File cấu hình:
- `services/trading-order-service/src/main/resources/application.properties`

---

## 4. SHIPPING DATABASE (shipping_db)

### Thông tin Database:
- **Database Name:** `shipping_db`
- **Container Name:** `shipping-db`
- **Host Port:** `3310`
- **Container Port:** `3306`
- **Username:** `root`
- **Password:** `root`

### Kết nối từ Docker (trong cùng network):
```properties
spring.datasource.url=jdbc:mysql://shipping-db:3306/shipping_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

### Kết nối từ Localhost:
```properties
spring.datasource.url=jdbc:mysql://localhost:3310/shipping_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

### Services sử dụng:
- ✅ **shipping-manager-service** (port 8083)

### File cấu hình:
- `services/shipping-manager-service/src/main/resources/application.properties`

---

## 5. BLOCKCHAIN DATABASE (bicap_blockchain_db)

### Thông tin Database:
- **Database Name:** `bicap_blockchain_db`
- **Container Name:** `blockchain-db`
- **Host Port:** `3311`
- **Container Port:** `3306`
- **Username:** `root`
- **Password:** `root`

### Kết nối từ Docker (trong cùng network):
```properties
spring.datasource.url=jdbc:mysql://blockchain-db:3306/bicap_blockchain_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

### Kết nối từ Localhost:
```properties
spring.datasource.url=jdbc:mysql://localhost:3311/bicap_blockchain_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

### Services sử dụng:
- ✅ **blockchain-adapter-service** (port 8084)

### File cấu hình:
- `services/blockchain-adapter-service/src/main/resources/application.properties`

---

## 📊 BẢNG TỔNG HỢP

| Database | Container | Host Port | Container Port | Database Name | Service |
|----------|-----------|-----------|----------------|---------------|---------|
| auth-db | auth-db | 3307 | 3306 | bicap_auth_db | auth-service, admin-service |
| farm-production-db | farm-production-db | 3308 | 3306 | farm_production_db | farm-production-service |
| trading-order-db | trading-order-db | 3309 | 3306 | bicap_order_db | trading-order-service |
| shipping-db | shipping-db | 3310 | 3306 | shipping_db | shipping-manager-service |
| blockchain-db | blockchain-db | 3311 | 3306 | bicap_blockchain_db | blockchain-adapter-service |

---

## 🔧 KẾT NỐI TỪ CÔNG CỤ QUẢN LÝ DATABASE

### MySQL Workbench / DBeaver / DataGrip:

#### 1. Auth Database:
```
Host: localhost
Port: 3307
Database: bicap_auth_db
Username: root
Password: root
```

#### 2. Farm Production Database:
```
Host: localhost
Port: 3308
Database: farm_production_db
Username: root
Password: root
```

#### 3. Trading Order Database:
```
Host: localhost
Port: 3309
Database: bicap_order_db
Username: root
Password: root
```

#### 4. Shipping Database:
```
Host: localhost
Port: 3310
Database: shipping_db
Username: root
Password: root
```

#### 5. Blockchain Database:
```
Host: localhost
Port: 3311
Database: bicap_blockchain_db
Username: root
Password: root
```

---

## 📝 LƯU Ý

1. **Trong Docker:** Các services kết nối đến databases bằng container name (ví dụ: `auth-db:3306`)
2. **Từ Localhost:** Sử dụng `localhost` với host port tương ứng (ví dụ: `localhost:3307`)
3. **Tất cả databases** đều sử dụng:
   - Username: `root`
   - Password: `root`
4. **Connection String Parameters:**
   - `useSSL=false` - Tắt SSL
   - `allowPublicKeyRetrieval=true` - Cho phép lấy public key
   - `createDatabaseIfNotExist=true` - Tự động tạo database nếu chưa tồn tại
   - `serverTimezone=Asia/Ho_Chi_Minh` - Timezone (chỉ trading-order-db)

---

## 🚀 KẾT NỐI BẰNG DÒNG LỆNH

### MySQL CLI:

```bash
# Auth Database
mysql -h localhost -P 3307 -u root -proot bicap_auth_db

# Farm Production Database
mysql -h localhost -P 3308 -u root -proot farm_production_db

# Trading Order Database
mysql -h localhost -P 3309 -u root -proot bicap_order_db

# Shipping Database
mysql -h localhost -P 3310 -u root -proot shipping_db

# Blockchain Database
mysql -h localhost -P 3311 -u root -proot bicap_blockchain_db
```

### Docker Exec:

```bash
# Auth Database
docker exec -it auth-db mysql -u root -proot bicap_auth_db

# Farm Production Database
docker exec -it farm-production-db mysql -u root -proot farm_production_db

# Trading Order Database
docker exec -it trading-order-db mysql -u root -proot bicap_order_db

# Shipping Database
docker exec -it shipping-db mysql -u root -proot shipping_db

# Blockchain Database
docker exec -it blockchain-db mysql -u root -proot bicap_blockchain_db
```

---

## 📁 CẤU HÌNH TRONG DOCKER-COMPOSE

Tất cả cấu hình database được định nghĩa trong file:
- `docker-compose.yml`

Các environment variables được set trong docker-compose sẽ override các giá trị trong `application.properties`.

---

## 🔧 TROUBLESHOOTING

### Lỗi: "Lost connection to MySQL server during query"

**Nguyên nhân:**
- MySQL container đang trong quá trình khởi động
- MySQL chưa sẵn sàng nhận kết nối từ host
- Container bị restart hoặc có vấn đề tạm thời

**Giải pháp:**

1. **Kiểm tra trạng thái container:**
```bash
docker ps --filter "name=auth-db" --format "{{.Status}}"
# Nếu thấy "health: starting" → đợi thêm vài giây
```

2. **Kiểm tra MySQL đã sẵn sàng:**
```bash
docker exec auth-db mysqladmin ping -h localhost -u root -proot
# Nếu thấy "mysqld is alive" → MySQL đã sẵn sàng
```

3. **Restart container nếu cần:**
```bash
docker restart auth-db
# Đợi 15-20 giây để MySQL khởi động hoàn toàn
```

4. **Kiểm tra port đang listen:**
```bash
netstat -an | grep 3307
# hoặc
lsof -i :3307
```

5. **Kiểm tra user permissions:**
```bash
docker exec auth-db mysql -u root -proot -e "SELECT User, Host FROM mysql.user WHERE User='root';"
# Phải có cả 'root'@'%' và 'root'@'localhost'
```

6. **Kiểm tra bind_address:**
```bash
docker exec auth-db mysql -u root -proot -e "SHOW VARIABLES LIKE 'bind_address';"
# Phải là '*' để cho phép kết nối từ host
```

### Lỗi: "Access denied for user 'root'@'127.0.0.1'"

**Giải pháp:**
```bash
# Tạo user root cho remote access
docker exec auth-db mysql -u root -proot -e "CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'root'; GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION; FLUSH PRIVILEGES;"
```

### Lỗi: "Can't connect to MySQL server"

**Giải pháp:**
1. Kiểm tra container đang chạy: `docker ps | grep auth-db`
2. Kiểm tra port mapping: `docker port auth-db`
3. Restart container: `docker restart auth-db`
4. Kiểm tra logs: `docker logs auth-db`

---

**Ngày tạo:** 26/01/2026  
**Phiên bản:** 1.1 (Added Troubleshooting)
