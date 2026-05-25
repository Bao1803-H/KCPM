# 🔐 THÔNG TIN ĐĂNG NHẬP ADMIN

## ✅ Tài khoản Admin đã sẵn sàng!

### 📋 Thông tin đăng nhập:

| Thông tin | Giá trị |
|-----------|---------|
| **Username** | `admin` |
| **Email** | `admin@gmail.com` |
| **Password** | `admin123` |
| **Role** | `ROLE_ADMIN` |
| **Status** | `ACTIVE` |

---

## 🌐 URL Truy cập:

### 1. Admin Web Interface:
- **URL:** http://localhost:3401
- **Port:** 3401

### 2. API Gateway (Kong):
- **Public URL:** http://localhost:8000
- **Admin API:** http://localhost:8001

### 3. Auth Service (Direct):
- **URL:** http://localhost:8088
- **Login API:** http://localhost:8088/api/auth/login

---

## 🧪 Test Đăng nhập:

### Cách 1: Qua Admin Web
1. Mở trình duyệt: **http://localhost:3401**
2. Đăng nhập với:
   - **Email:** `admin@gmail.com`
   - **Password:** `admin123`

### Cách 2: Qua API (curl)

```bash
# Test với password "admin123"
curl -X POST http://localhost:8088/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "admin123"
  }'

# Hoặc qua Kong Gateway
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "admin123"
  }'
```

**Response thành công sẽ trả về JWT token:**
```json
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🔄 Reset/Đổi Password:

Nếu cần đổi password, bạn có thể:

### Option 1: Sử dụng Script Helper (Khuyến nghị)
```bash
./create_admin_password.sh admin123
```
Script sẽ hướng dẫn bạn tạo BCrypt hash và update password.

### Option 2: Sử dụng BCrypt Hash Generator
1. Truy cập: https://bcrypt-generator.com/
2. Nhập password mới (ví dụ: `admin123`)
3. Chọn rounds: `10`
4. Copy hash được tạo
5. Update trong database:

```bash
docker exec auth-db mysql -uroot -proot bicap_auth_db -e \
  "UPDATE users SET password = '\$2a\$10\$YOUR_NEW_HASH_HERE' WHERE username = 'admin';"
```

### Option 2: Tạo user mới qua API Register
```bash
curl -X POST http://localhost:8088/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newadmin",
    "email": "newadmin@example.com",
    "password": "yourpassword",
    "role": "ADMIN"
  }'
```

**Lưu ý:** Role ADMIN có thể không được tạo tự động qua register API, cần gán thủ công trong database.

---

## 🔍 Kiểm tra Database:

### Xem thông tin user:
```bash
docker exec auth-db mysql -uroot -proot bicap_auth_db -e \
  "SELECT u.id, u.username, u.email, u.status, GROUP_CONCAT(r.name) as roles \
   FROM users u \
   LEFT JOIN user_roles ur ON u.id = ur.user_id \
   LEFT JOIN roles r ON ur.role_id = r.id \
   WHERE u.username = 'admin' \
   GROUP BY u.id;"
```

### Xem tất cả users:
```bash
docker exec auth-db mysql -uroot -proot bicap_auth_db -e \
  "SELECT id, username, email, status FROM users;"
```

---

## ⚠️ Lưu ý quan trọng:

1. **Password hiện tại:** Password hash trong database có thể tương ứng với password `admin` hoặc password khác từ file SQL ban đầu
2. **Bảo mật:** Đổi password ngay khi deploy lên production
3. **BCrypt:** Hệ thống sử dụng BCrypt với strength 10
4. **Role:** Chỉ user có role `ROLE_ADMIN` mới truy cập được admin panel

---

## 🆘 Troubleshooting:

### Không đăng nhập được?

1. **Kiểm tra services đang chạy:**
   ```bash
   docker ps | grep -E "(auth-service|admin-web|kong-gateway)"
   ```

2. **Kiểm tra logs:**
   ```bash
   docker logs auth-service --tail 50
   docker logs admin-web --tail 50
   ```

3. **Kiểm tra database connection:**
   ```bash
   docker exec auth-db mysql -uroot -proot bicap_auth_db -e "SELECT 1;"
   ```

4. **Test API trực tiếp:**
   ```bash
   curl -X POST http://localhost:8088/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@gmail.com","password":"admin123"}'
   ```

### Password không đúng?

Password hiện tại là: **`admin123`**

Nếu vẫn không đăng nhập được, reset password bằng cách tạo BCrypt hash mới (xem phần Reset Password ở trên).

---

## 📝 Tạo Admin Account mới:

```sql
-- Tạo user mới
INSERT INTO users (username, email, password, status)
VALUES ('newadmin', 'newadmin@example.com', '$2a$10$YOUR_BCRYPT_HASH', 'ACTIVE');

-- Lấy user_id
SET @user_id = LAST_INSERT_ID();

-- Gán role ADMIN (role_id = 1)
INSERT INTO user_roles (user_id, role_id)
VALUES (@user_id, 1);
```

---

**Tạo bởi:** BICAP System  
**Ngày:** 2026-01-26  
**Version:** 1.0
