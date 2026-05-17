# Shipping Manager Frontend

Frontend React application cho Shipping Manager Service của hệ thống BICAP.

## Yêu cầu

- Node.js >= 14.x
- npm hoặc yarn

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

3. Tạo file `.env` với nội dung:
```bash
REACT_APP_SHIPPING_API_URL=http://localhost:8083/api
REACT_APP_FARM_API_URL=http://localhost:8081/api
REACT_APP_AUTH_API_URL=http://localhost:8085/api/auth
```

**Lưu ý**: Auth Service chạy ở port **8085** (không phải 8080)

## Chạy ứng dụng

```bash
npm start
```

Ứng dụng sẽ chạy tại http://localhost:3000

## Build cho production

```bash
npm run build
```

## Cấu trúc thư mục

```
src/
├── components/          # Các component tái sử dụng
│   ├── Layout.js       # Layout chính
│   ├── Sidebar.js      # Sidebar navigation
│   ├── Header.js       # Header
│   └── ProtectedRoute.js # Route protection
├── pages/              # Các trang chính
│   ├── Login.js        # Trang đăng nhập
│   ├── Dashboard.js    # Dashboard tổng quan
│   ├── Orders.js       # Quản lý đơn hàng
│   ├── Shipments.js    # Quản lý vận đơn
│   ├── Vehicles.js     # Quản lý xe
│   ├── Drivers.js      # Quản lý tài xế
│   └── Reports.js      # Báo cáo
├── services/           # API services
│   └── api.js          # API client
├── App.js              # Component chính
└── index.js            # Entry point
```

## Tính năng

Theo yêu cầu từ TastRequirement.txt, Shipping Manager có các tính năng:

1. **Xem đơn hàng thành công** - Trang Orders hiển thị các đơn hàng đã được xác nhận từ Retailers và Farm Managements
2. **Tạo vận đơn** - Tạo vận đơn cho mỗi đơn hàng thành công
3. **Hủy vận đơn** - Hủy các vận đơn đã tạo
4. **Xem tiến trình vận chuyển** - Xem trạng thái và tiến trình của các vận đơn
5. **Quản lý xe** - CRUD cho phương tiện vận chuyển
6. **Quản lý tài xế** - CRUD cho tài xế
7. **Báo cáo** - Xem báo cáo tổng hợp và gửi báo cáo cho Admin
8. **Gửi thông báo** - (Cần tích hợp với notification service)

## Lưu ý

- Một số tính năng như Update/Delete cho Drivers và Vehicles có thể cần backend hỗ trợ thêm endpoints
- Authentication sử dụng JWT token được lưu trong localStorage
- Cần đảm bảo các backend services đang chạy trước khi sử dụng frontend
