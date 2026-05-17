# ✅ HOÀN THÀNH: Hệ thống Thông báo Real-time

## 📋 Tổng kết những gì đã làm

### 1. **Backend (Node.js)**
✅ Thêm dependency `amqplib` vào package.json
✅ Tạo `notificationController.js` - Kết nối RabbitMQ và xử lý SSE
✅ Cập nhật routes trong `authentication.js`
✅ Cấu hình RABBITMQ_URL trong `.env`

### 2. **Frontend**
✅ Cập nhật `notifications.ejs` với:
   - SSE client tự động kết nối
   - Hiển thị notifications real-time
   - Animation và sound effects
   - Các chức năng: xóa, clear all, test

### 3. **Java Service (Farm Production)**
✅ Tạo `NotificationDTO.java` - Data model
✅ Tạo `NotificationService.java` - Helper service để gửi notifications
✅ Tạo `RabbitMQConfig.java` - RabbitMQ configuration

### 4. **Docker**
✅ Cập nhật `docker-compose.yml` - Thêm RABBITMQ_URL cho farm-management-web

## 🚀 Cách sử dụng

### Bước 1: Cài đặt dependencies
```bash
cd clients/web-app/farm-management-web
npm install
```

### Bước 2: Khởi động services
```bash
cd d:\CNPMOOP\frontend-farm\BICAP
docker-compose up -d
```

Hoặc chỉ khởi động RabbitMQ:
```bash
docker-compose up -d bicap-message-queue
```

### Bước 3: Chạy farm-management-web
```bash
cd clients/web-app/farm-management-web
npm start
```

### Bước 4: Truy cập trang thông báo
Mở trình duyệt: **http://localhost:3002/notifications**

### Bước 5: Test thông báo
Click nút **"Gửi test"** trên trang để gửi thông báo thử nghiệm

## 📡 Gửi thông báo từ Java Service

### Cách 1: Inject NotificationService
```java
@Autowired
private NotificationService notificationService;

// Gửi thông báo thành công
notificationService.sendSuccess("Lô hàng mới", "Đã tạo lô xuất hàng LH001");

// Gửi cảnh báo
notificationService.sendWarning("Cảnh báo tồn kho", "Rau cải sắp hết");

// Gửi lỗi
notificationService.sendError("Lỗi xử lý", "Không thể tạo đơn hàng");
```

### Cách 2: Sử dụng methods có sẵn
```java
// Thông báo lô hàng mới
notificationService.notifyBatchCreated("LH001", "Rau cải xanh");

// Cảnh báo hết hàng
notificationService.notifyLowStock("Rau cải", 5.0, "kg");

// Sẵn sàng vận chuyển
notificationService.notifyBatchReadyToShip("LH001");
```

### Cách 3: Custom routing key
```java
notificationService.sendNotification(
    "order",                    // type
    "order.created",            // routing key
    "Đơn hàng mới",            // title
    "Đơn hàng #12345 từ KH001" // message
);
```

## 🎨 Các loại thông báo

| Type | Màu sắc | Icon | Routing Pattern |
|------|---------|------|----------------|
| `success` | Xanh lá | check_circle | farm.success, order.success |
| `info` | Xanh dương | info | farm.info, order.info |
| `warning` | Vàng | warning | farm.warning |
| `error` | Đỏ | error | farm.error |
| `order` | Xanh | shopping_cart | order.# |
| `shipping` | Xám | local_shipping | shipping.# |

## 🔧 Troubleshooting

### Lỗi: Cannot connect to RabbitMQ
**Giải pháp:**
```bash
# Kiểm tra RabbitMQ đang chạy
docker ps | grep rabbitmq

# Khởi động RabbitMQ
docker-compose up -d bicap-message-queue

# Xem logs
docker logs bicap-message-queue
```

### Thông báo không hiển thị
**Kiểm tra:**
1. Mở Console (F12) → Network → Xem SSE connection
2. Mở Console → Xem logs "SSE Connected"
3. Kiểm tra routing key đúng pattern (farm.#, order.#, shipping.#)

### Test thủ công qua RabbitMQ Management
1. Truy cập: http://localhost:15672
2. Login: `root` / `0862264719Phi`
3. Vào tab "Exchanges" → Click "notifications.exchange"
4. Scroll xuống "Publish message"
5. Routing key: `farm.test`
6. Payload:
```json
{
  "type": "success",
  "title": "Test từ RabbitMQ",
  "message": "Thông báo thử nghiệm",
  "from": "RabbitMQ Management"
}
```
7. Click "Publish message"
8. Xem thông báo hiển thị trên trang /notifications

## 📊 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/notifications` | Trang thông báo (Web UI) |
| GET | `/api/notifications/stream` | SSE endpoint (real-time) |
| GET | `/api/notifications` | Lấy danh sách thông báo |
| POST | `/api/notifications/:id/read` | Đánh dấu đã đọc |
| DELETE | `/api/notifications/:id` | Xóa 1 thông báo |
| DELETE | `/api/notifications` | Xóa tất cả |
| POST | `/api/notifications/test` | Gửi thông báo test |

## 📝 Ví dụ thực tế

### Khi tạo lô hàng mới
```java
@PostMapping("/batches")
public ResponseEntity<Batch> createBatch(@RequestBody BatchRequest request) {
    Batch batch = batchService.create(request);
    
    // Gửi thông báo
    notificationService.notifyBatchCreated(
        batch.getBatchCode(),
        batch.getProduct().getName()
    );
    
    return ResponseEntity.ok(batch);
}
```

### Khi sản phẩm sắp hết
```java
public void checkLowStock(Product product) {
    if (product.getQuantity() < product.getMinStock()) {
        notificationService.notifyLowStock(
            product.getName(),
            product.getQuantity(),
            product.getUnit()
        );
    }
}
```

### Khi đơn hàng mới
```java
@PostMapping("/orders")
public ResponseEntity<Order> createOrder(@RequestBody OrderRequest request) {
    Order order = orderService.create(request);
    
    notificationService.sendNotification(
        "order",
        "order.new",
        "Đơn hàng mới",
        "Đơn hàng #" + order.getId() + " từ " + order.getCustomerName()
    );
    
    return ResponseEntity.ok(order);
}
```

## 🎯 Tính năng đã có

✅ **Real-time**: Thông báo hiện ngay lập tức không cần refresh
✅ **Auto-reconnect**: Tự động kết nối lại khi mất kết nối
✅ **Persistent**: Lưu 100 thông báo gần nhất trong memory
✅ **Visual feedback**: Icon, màu sắc, animation theo từng loại
✅ **Sound effect**: Âm thanh khi có thông báo mới
✅ **Delete/Clear**: Xóa từng thông báo hoặc xóa tất cả
✅ **Time ago**: Hiển thị thời gian tương đối (vừa xong, 5 phút trước...)
✅ **Connection status**: Badge hiển thị trạng thái kết nối
✅ **Test button**: Gửi thông báo thử nghiệm

## 📚 Tài liệu tham khảo

- [NOTIFICATIONS_README.md](./NOTIFICATIONS_README.md) - Hướng dẫn chi tiết
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

## 🎉 Kết luận

Hệ thống thông báo real-time đã hoàn thành và sẵn sàng sử dụng!
Các service Java có thể gửi thông báo qua RabbitMQ và frontend sẽ nhận được ngay lập tức.
