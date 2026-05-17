# Hệ thống Thông báo Real-time với RabbitMQ

## Tổng quan

Hệ thống thông báo real-time sử dụng RabbitMQ và Server-Sent Events (SSE) để push notifications từ các service khác tới frontend.

## Kiến trúc

```
┌─────────────────┐      ┌──────────────┐      ┌─────────────────┐
│  Other Services │ ───> │   RabbitMQ   │ ───> │ Farm-Web-Server │
│ (Order, Ship..) │      │   Exchange   │      │ (Node.js + SSE) │
└─────────────────┘      └──────────────┘      └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │  Web Browser    │
                                                │ (SSE Client)    │
                                                └─────────────────┘
```

## Cấu hình RabbitMQ

### 1. Exchange và Queue
- **Exchange**: `notifications.exchange` (type: topic)
- **Queue**: `farm.notifications` (durable)
- **Routing Keys**:
  - `farm.#` - Thông báo về trang trại
  - `order.#` - Thông báo về đơn hàng
  - `shipping.#` - Thông báo về vận chuyển

### 2. Environment Variables (.env)
```env
RABBITMQ_URL=amqp://rabbitmq:5672
```

## Cách gửi thông báo từ Service khác

### Java Service (với Spring AMQP)

```java
@Service
public class NotificationService {
    
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    public void sendNotification(String type, String title, String message) {
        NotificationDTO notification = NotificationDTO.builder()
            .type(type)  // "success", "info", "warning", "error", "order", "shipping"
            .title(title)
            .message(message)
            .from("Order Service")
            .timestamp(Instant.now().toString())
            .build();
            
        rabbitTemplate.convertAndSend(
            "notifications.exchange",
            "order.new",  // routing key
            notification
        );
    }
}
```

### Node.js Service

```javascript
const amqp = require('amqplib');

async function sendNotification(type, title, message) {
    const connection = await amqp.connect('amqp://rabbitmq:5672');
    const channel = await connection.createChannel();
    
    await channel.assertExchange('notifications.exchange', 'topic', { durable: true });
    
    const notification = {
        type: type,
        title: title,
        message: message,
        from: 'Shipping Service',
        timestamp: new Date().toISOString()
    };
    
    channel.publish(
        'notifications.exchange',
        'shipping.status',
        Buffer.from(JSON.stringify(notification)),
        { persistent: true }
    );
    
    await channel.close();
    await connection.close();
}
```

## Định dạng Notification

```typescript
interface Notification {
    id?: string;           // Auto-generated nếu không có
    type: string;          // "success" | "info" | "warning" | "error" | "order" | "shipping"
    title: string;         // Tiêu đề thông báo
    message: string;       // Nội dung thông báo
    from?: string;         // Nguồn gửi (tên service)
    timestamp?: string;    // ISO 8601 timestamp
    read?: boolean;        // Đã đọc chưa
}
```

## API Endpoints

### GET /notifications
Hiển thị trang thông báo (Web UI)

### GET /api/notifications/stream
Server-Sent Events endpoint - Kết nối real-time

### GET /api/notifications
Lấy danh sách thông báo
- Query params: `?limit=50`

### POST /api/notifications/:id/read
Đánh dấu thông báo đã đọc

### DELETE /api/notifications/:id
Xóa một thông báo

### DELETE /api/notifications
Xóa tất cả thông báo

### POST /api/notifications/test
Gửi thông báo test (Debug)

## Frontend Integration

Frontend tự động kết nối SSE khi mở trang `/notifications`:

```javascript
// SSE connection tự động khởi tạo
const eventSource = new EventSource('/api/notifications/stream');

eventSource.onmessage = (event) => {
    const notification = JSON.parse(event.data);
    // Hiển thị notification trên UI
};
```

## Ví dụ sử dụng

### Gửi thông báo đơn hàng mới
```java
notificationService.sendNotification(
    "order",
    "Đơn hàng mới",
    "Bạn có một đơn hàng mới #12345 từ khách hàng Nguyễn Văn A"
);
```

### Gửi thông báo vận chuyển
```javascript
sendNotification(
    "shipping",
    "Vận chuyển hoàn tất",
    "Đơn hàng #12345 đã được giao thành công"
);
```

### Gửi cảnh báo
```java
notificationService.sendNotification(
    "warning",
    "Cảnh báo tồn kho",
    "Sản phẩm 'Rau cải xanh' sắp hết hàng (còn 5 kg)"
);
```

## Troubleshooting

### RabbitMQ không kết nối được
1. Kiểm tra RabbitMQ đang chạy: `docker ps | grep rabbitmq`
2. Kiểm tra RABBITMQ_URL trong .env
3. Xem logs: `docker logs <rabbitmq-container>`

### Thông báo không hiển thị
1. Mở Console (F12) kiểm tra SSE connection
2. Kiểm tra routing key đúng pattern (`farm.#`, `order.#`, `shipping.#`)
3. Verify exchange và queue đã được tạo trong RabbitMQ Management

### Test thủ công
1. Vào trang `/notifications`
2. Click button "Gửi test" để gửi thông báo thử
3. Kiểm tra thông báo hiển thị real-time

## RabbitMQ Management UI
Access: http://localhost:15672
- Username: guest
- Password: guest

Tại đây bạn có thể:
- Xem exchanges, queues, bindings
- Gửi message test
- Monitor message flow
