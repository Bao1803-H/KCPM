# 🚀 HƯỚNG DẪN CÀI ĐẶT VÀ KHỞI CHẠY DỰ ÁN BICAP TRÊN LOCAL
> [!NOTE]
> Tài liệu này được biên soạn bởi chuyên gia DevOps dành cho các lập trình viên mới bắt đầu tiếp cận dự án microservices **BICAP**. Tài liệu cung cấp đầy đủ thông tin từ việc nhận diện dự án, cài đặt môi trường, cấu hình cơ sở dữ liệu cho đến khởi chạy và xử lý các lỗi thường gặp.

---

## 📂 PHẦN 1: CÁCH TỰ KIỂM TRA & NHẬN DIỆN FRAMEWORK/NGÔN NGỮ CỦA DỰ ÁN
Khi tiếp cận một repository mới clone từ Git, bước đầu tiên của một kỹ sư DevOps là quan sát cấu trúc thư mục và các file cấu hình đặc trưng để xác định ngôn ngữ và công cụ cần dùng.

Dưới đây là bảng tra cứu nhanh các file cấu hình tương ứng với từng công nghệ:

| File cấu hình đặc trưng | Ngôn ngữ / Framework | Công cụ quản lý gói & lệnh khởi chạy phổ biến |
| :--- | :--- | :--- |
| **`package.json`** | JavaScript / TypeScript (Node.js, React, Vue...) | `npm install`, `yarn install`, `pnpm install` |
| **`pom.xml`** | Java (Maven) | `mvn clean install`, `./mvnw spring-boot:run` |
| **`build.gradle`** | Java / Kotlin (Gradle) | `./gradlew build`, `./gradlew bootRun` |
| **`requirements.txt`**, `Pipfile`, `pyproject.toml` | Python | `pip install -r requirements.txt`, `poetry install` |
| **`go.mod`** | Go (Golang) | `go mod download`, `go run main.go` |
| **`composer.json`** | PHP | `composer install` |
| **`Gemfile`** | Ruby | `bundle install` |
| **`Dockerfile`**, **`docker-compose.yml`** | Docker (Mọi ngôn ngữ) | `docker build`, `docker-compose up` |

### 🔍 Nhận diện cấu trúc dự án BICAP:
Nhìn vào cấu trúc thư mục của **BICAP**, ta có thể dễ dàng xác định đây là một hệ thống **Microservices** phân tán kết hợp **Monorepo**:
1. **Thư mục `services/`**: Chứa 7 thư mục con, mỗi thư mục có file `pom.xml` và `mvnw.cmd` -> Dự án sử dụng **Java Spring Boot (Maven)** làm Backend.
2. **Thư mục `clients/web-app/`**: Chứa 5 thư mục con (`admin-web`, `guest-web`...) có file `package.json` -> Dự án sử dụng **Node.js (Express & EJS)** làm Frontend.
3. **Thư mục `api-gateway/`**: Chứa file `kong.yml` -> Sử dụng **Kong API Gateway** để định tuyến API.
4. **File `docker-compose.yml`**: Chứa cấu hình chạy toàn bộ hệ thống (dịch vụ, cơ sở dữ liệu, message queue, object storage) qua container.

---

## 🛠️ PHẦN 2: KIỂM TRA & CÀI ĐẶT MÔI TRƯỜNG PHÁT TRIỂN
Trước khi bắt đầu cài đặt, bạn cần kiểm tra xem máy tính cá nhân đã được cài đặt các công cụ cần thiết hay chưa.

### 1. Lệnh kiểm tra phiên bản trên máy (Chạy trên Terminal/PowerShell):
Mở **PowerShell (Windows)** hoặc **Terminal (Mac/Linux)** và chạy lần lượt các lệnh sau:

```bash
# Kiểm tra Git
git --version

# Kiểm tra Node.js và NPM (Yêu cầu Node 18+ hoặc 20+ LTS)
node -v
npm -v

# Kiểm tra Java (Dự án yêu cầu Java 21)
java -version

# Kiểm tra Maven (Quản lý build Java)
mvn -version

# Kiểm tra Docker và Docker Desktop
docker --version
docker-compose --version
```

### 2. Hướng dẫn cài đặt nếu chưa có:
*   **Windows**:
    *   **Docker Desktop**: Tải installer từ trang chủ [Docker](https://www.docker.com/products/docker-desktop/) và cài đặt. Đảm bảo đã bật WSL 2 backend.
    *   **Node.js**: Tải bản LTS từ [Node.js](https://nodejs.org/). Hoặc cài qua dòng lệnh:
        ```powershell
        winget install OpenJS.NodeJS.LTS
        ```
    *   **Java 21**: Tải bản Eclipse Temurin hoặc Microsoft JDK 21. Hoặc cài qua dòng lệnh:
        ```powershell
        winget install EclipseAdoptium.Temurin.21.JDK
        ```
*   **macOS**:
    *   Sử dụng **Homebrew** để cài nhanh các công cụ:
        ```bash
        brew install git node openjdk@21 maven docker docker-compose
        ```
*   **Linux (Ubuntu/Debian)**:
    ```bash
    sudo apt update
    sudo apt install git nodejs npm openjdk-21-jdk maven docker.io docker-compose -y
    ```

---

## 📦 PHẦN 3: CÀI ĐẶT DEPENDENCIES (THƯ VIỆN)
Vì dự án bao gồm cả Backend (Java) và Frontend (Node.js), ta cần cài đặt thư viện cho từng thành phần.

### 1. Cài đặt thư viện cho Frontend (Node.js Clients):
Tại thư mục gốc của dự án (`BICAP-main`), chạy lệnh bootstrap đã được cấu hình sẵn trong `package.json` để cài đặt thư viện cho toàn bộ các client frontend:
```bash
npm run bootstrap
```
*Tác dụng:* Lệnh này thực hiện `npm install` tự động cho tất cả các folder frontend được khai báo trong workspaces.

Nếu muốn cài thủ công cho một frontend cụ thể (Ví dụ: `guest-web`):
```bash
cd clients/web-app/guest-web
npm install
```

### 2. Cài đặt thư viện cho Backend (Java Maven Services):
Tại thư mục gốc của từng service (Ví dụ: `services/auth-service`), ta có thể tải dependencies của Spring Boot bằng lệnh:
```bash
cd services/auth-service
# Trên Windows
.\mvnw clean install -DskipTests
# Trên Mac/Linux
./mvnw clean install -DskipTests
```
*Tác dụng:* Tải toàn bộ thư viện Java (Spring Boot, Hibernate, MySQL Connector, JWT...) được khai báo trong `pom.xml` và biên dịch mã nguồn bỏ qua bước chạy test để tiết kiệm thời gian.

---

## ⚙️ PHẦN 4: CẤU HÌNH BIẾN MÔI TRƯỜNG (ENVIRONMENT VARIABLES)
Các microservices và ứng dụng client cần cấu hình cổng kết nối và các khóa bảo mật qua file biến môi trường `.env`.

### 1. Sao chép file cấu hình mẫu:
Chạy lệnh sau tại thư mục gốc của dự án (`BICAP-main`):
*   **Windows (PowerShell)**:
    ```powershell
    Copy-Item .env.example .env
    ```
*   **Windows (CMD)**:
    ```cmd
    copy .env.example .env
    ```
*   **Mac/Linux**:
    ```bash
    cp .env.example .env
    ```

### 2. Giải thích chi tiết các biến quan trọng trong file `.env`:
Mở file `.env` vừa tạo, bạn sẽ thấy các cấu hình sau:
```env
# Định nghĩa cổng (port) chạy trên trình duyệt của các trang Web
RETAILER_WEB_PORT=3400             # Cổng cho trang web của Nhà bán lẻ
ADMIN_WEB_PORT=3401                # Cổng cho trang web Quản trị viên (Admin)
FARM_WEB_PORT=3402                 # Cổng cho trang web Quản lý nông trại
SHIPPING_MANAGER_WEB_PORT=3403     # Cổng cho trang web Quản lý vận chuyển
GUEST_WEB_PORT=3405                # Cổng cho trang khách vãng lai

# Cấu hình tích hợp JIRA (Dùng cho DevOps tracking lỗi tự động)
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@gmail.com
JIRA_API_TOKEN=ATATT3xFf...
JIRA_PROJECT_KEY=KCPM
```

---

## 🗄️ PHẦN 5: THIẾT LẬP CƠ SỞ DỮ LIỆU (DATABASE SETUP)
Dự án BICAP sử dụng **5 database MySQL** độc lập tương ứng với các dịch vụ khác nhau. Việc thiết lập bằng Docker là cách nhanh nhất và an toàn nhất.

### Cách 1: Thiết lập tự động bằng Docker (Khuyến nghị)
Khi bạn chạy Docker Compose, hệ thống sẽ tự động khởi tạo các container database MySQL, gán mật khẩu root và import các file SQL mẫu có sẵn trong thư mục `database/`.

*   Cơ chế hoạt động: File `docker-compose.yml` ánh xạ các file SQL vào thư mục `/docker-entrypoint-initdb.d/` bên trong container. MySQL sẽ tự động chạy các script này khi khởi động lần đầu.
    *   `auth-db` chạy script `bicap_auth_db.sql`
    *   `shipping-db` chạy script `bicap_shipping_db.sql`
    *   `blockchain-db` chạy các script blockchain và log
*   *Lưu ý riêng cho `farm-production-db`:* Service này được thiết lập `spring.jpa.hibernate.ddl-auto=none` để tránh ghi đè dữ liệu. Nếu gặp lỗi thiếu bảng hoặc dữ liệu, bạn cần làm theo bước manual dưới đây.

### Cách 2: Thiết lập thủ công (Manual) trên MySQL Local
Nếu bạn không dùng Docker cho database mà cài MySQL trực tiếp lên máy:

1.  **Mở công cụ quản lý cơ sở dữ liệu** (DBeaver, MySQL Workbench hoặc Navicat) và kết nối tới MySQL local.
2.  **Tạo 6 database trống** bằng cách chạy các câu lệnh SQL sau:
    ```sql
    CREATE DATABASE bicap_auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    CREATE DATABASE farm_production_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    CREATE DATABASE bicap_order_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    CREATE DATABASE shipping_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    CREATE DATABASE bicap_blockchain_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    CREATE DATABASE image_storage_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    ```
3.  **Import dữ liệu mẫu (Seed Data)**:
    Thực hiện chạy file SQL tương ứng cho từng database:
    *   Import file `database/auth-database/bicap_auth_db.sql` vào database `bicap_auth_db`.
    *   Import file `database/farm-production-database/bicap_farm_db.sql` vào database `farm_production_db`.
    *   Import file `database/order-database/bicap_order_db.sql` vào database `bicap_order_db`.
    *   Import file `database/shipping-db/bicap_shipping_db.sql` vào database `shipping_db`.
    *   Import file `database/blockchain-adapter-database/bicap_blockchain_db_blockchain_records.sql` vào database `bicap_blockchain_db`.
    *   Import file `database/image-storage-db/image_storage_db.sql` vào database `image_storage_db`.

---

## 🚀 PHẦN 6: KHỞI CHẠY DỰ ÁN
Có hai phương pháp chính để chạy dự án này trên môi trường local.

### Phương pháp 1: Khởi chạy toàn bộ hệ thống bằng Docker Compose (Đơn giản nhất)
Chỉ cần một câu lệnh duy nhất để khởi động toàn bộ backend, frontend, database và các hạ tầng bổ trợ (Kong, RabbitMQ, MinIO):

1.  Mở dòng lệnh tại thư mục gốc `BICAP-main`.
2.  Chạy lệnh build và khởi động hệ thống:
    ```bash
    docker-compose up --build -d
    ```
    *Tác dụng:* `--build` ép buộc Docker dựng lại các image mới nhất cho services/clients, `-d` chạy ngầm dưới background.
3.  Kiểm tra xem các container đã hoạt động ổn định chưa:
    ```bash
    docker-compose ps
    ```

### Phương pháp 2: Chạy độc lập từng dịch vụ (Dành cho nhà phát triển chỉnh sửa code)
Nếu bạn muốn sửa code và xem log trực tiếp mà không cần rebuild Docker container:

#### Bước 1: Khởi chạy phần hạ tầng cơ sở dữ liệu và queue (Docker)
Chạy các dịch vụ bổ trợ bằng Docker trước để giải phóng tài nguyên cho RAM:
```bash
docker-compose up -d auth-db farm-production-db trading-order-db shipping-db blockchain-db image-storage-db bicap-message-queue minio kong-gateway
```

#### Bước 2: Chạy các dịch vụ Backend (Java Spring Boot)
Mở các tab terminal riêng biệt cho từng service và khởi chạy:
```bash
# Ví dụ chạy Auth Service
cd services/auth-service
./mvnw spring-boot:run

# Ví dụ chạy Farm Production Service
cd services/farm-production-service
./mvnw spring-boot:run
```
*(Lặp lại tương tự cho `trading-order-service`, `shipping-manager-service`, `blockchain-adapter-service`, `admin_service`, `image-storage-service`)*

#### Bước 3: Chạy các ứng dụng Web Frontend (Node.js)
Mở các tab terminal riêng cho từng client và khởi chạy ở chế độ dev:
```bash
# Chạy Admin Web
cd clients/web-app/admin-web
npm start

# Chạy Guest Web (Khách vãng lai)
cd clients/web-app/guest-web
npm run dev
```

---

## 🌐 PHẦN 7: KIỂM TRA KẾT QUẢ TRÊN TRÌNH DUYỆT
Sau khi chạy thành công, bạn hãy mở trình duyệt web và truy cập vào các địa chỉ sau để kiểm tra:

### 🖥️ Các giao diện người dùng (Frontend):
*   **Trang Khách vãng lai (Guest Web)**: [http://localhost:3405](http://localhost:3405) (Xem thông tin nông nghiệp sạch)
*   **Trang Nhà bán lẻ (Retailer Web)**: [http://localhost:3400](http://localhost:3400) (Đặt mua nông sản)
*   **Trang Quản lý nông trại (Farm Management)**: [http://localhost:3402](http://localhost:3402)
*   **Trang Admin quản trị (Admin Web)**: [http://localhost:3401](http://localhost:3401)
    > 🔑 **Thông tin tài khoản Admin mặc định:**
    > *   **Email:** `admin@gmail.com`
    > *   **Password:** `admin123`
*   **Trang Quản lý vận chuyển (Shipping Web)**: [http://localhost:3403](http://localhost:3403)

### ⚙️ Các trang quản trị hạ tầng (DevOps & Backend):
*   **API Gateway Kong**: [http://localhost:8000](http://localhost:8000) (Mọi API đi qua cổng này)
*   **Trình quản lý RabbitMQ (Queue)**: [http://localhost:15672](http://localhost:15672) (User/Pass: `root` / `root`)
*   **Trình quản lý file MinIO (S3 Storage)**: [http://localhost:9001](http://localhost:9001) (User/Pass: `minioadmin` / `minioadmin`)

---

## 🚨 PHẦN 8: XỬ LÝ CÁC LỖI THƯỜNG GẶP KHI CHẠY DỰ ÁN LẦN ĐẦU

### 🛑 Lỗi 1: Trùng cổng kết nối (Port Collision / Address already in use)
*   **Triệu chứng:** Console thông báo: `Error: listen EADDRINUSE: address already in use :::3000` hoặc `Port 3306 is already in use`.
*   **Nguyên nhân:** Có một ứng dụng khác (ví dụ: MySQL cài sẵn trên máy) đang chiếm cổng mà dự án cần.
*   **Cách khắc phục:**
    *   *Đối với Windows:* Tìm PID đang chạy trên cổng đó và tắt đi:
        ```powershell
        # Tìm PID (ví dụ cổng 3306)
        netstat -ano | findstr :3306
        # Giả sử PID tìm thấy là 4312, hãy kill nó
        taskkill /F /PID 4312
        ```
    *   *Đối với Mac/Linux:*
        ```bash
        sudo lsof -i :3306
        sudo kill -9 <PID>
        ```
    *   *Cách khác:* Đổi cổng ứng dụng trong file `.env` (ví dụ: sửa `ADMIN_WEB_PORT=3401` thành `3411`).

### 🛑 Lỗi 2: Dịch vụ Backend khởi động thất bại do Database chưa sẵn sàng
*   **Triệu chứng:** Spring Boot bắn lỗi `java.sql.SQLNonTransientConnectionException: Could not create connection to database server` và tự động crash khi khởi động bằng docker-compose.
*   **Nguyên nhân:** Container database khởi động chậm hơn container dịch vụ Java, khiến dịch vụ Java cố kết nối vào thời điểm DB chưa online.
*   **Cách khắc phục:**
    1.  Chờ 10-15 giây để container database online hoàn toàn và báo trạng thái `healthy`.
    2.  Chỉ cần khởi động lại container backend bị crash:
        ```bash
        docker-compose restart auth-service farm-production-service
        ```
    3.  Cấu hình `depends_on` kèm `condition: service_healthy` đã được thiết lập sẵn trong `docker-compose.yml` để hạn chế lỗi này.

### 🛑 Lỗi 3: Lỗi phiên bản Java (Unsupported class version error)
*   **Triệu chứng:** Lỗi log biên dịch Backend: `class file has wrong version 65.0, should be 61.0` hoặc tương tự.
*   **Nguyên nhân:** Máy tính của bạn đang sử dụng phiên bản Java JDK cũ (ví dụ Java 17 hoặc 11) trong khi dự án BICAP yêu cầu **Java 21** (class version 65).
*   **Cách khắc phục:**
    1.  Cài đặt JDK 21 như hướng dẫn ở Phần 2.
    2.  Thiết lập lại biến môi trường `JAVA_HOME` trỏ tới thư mục cài đặt JDK 21.
    3.  Khởi động lại Terminal/IDE (VS Code, IntelliJ IDEA) để áp dụng cấu hình JDK mới.

### 🛑 Lỗi 4: Lỗi phân quyền ghi dữ liệu MySQL trên Docker Volume
*   **Triệu chứng:** Database báo lỗi `read-only file system` hoặc container MySQL tự động restart liên tục kèm log lỗi ghi file.
*   **Nguyên nhân:** Thư mục chứa dữ liệu MySQL (`docker volume` hoặc thư mục map trên Windows) bị lỗi đồng bộ/phân quyền (đặc biệt khi lưu trên OneDrive hoặc iCloud Drive).
*   **Cách khắc phục:**
    *   Đảm bảo thư mục dự án không nằm trong các thư mục đồng bộ đám mây như **OneDrive** hoặc **iCloud**.
    *   Dọn dẹp volume cũ bị lỗi phân quyền và khởi động lại:
        ```bash
        docker-compose down -v
        docker-compose up --build -d
        ```

### 🛑 Lỗi 5: Lỗi thiếu biến môi trường hoặc cấu hình API Gateway Kong
*   **Triệu chứng:** Frontend chạy bình thường nhưng khi bấm đăng nhập hoặc thao tác thì báo lỗi `Network Error` hoặc `404 Not Found` từ API Gateway.
*   **Nguyên nhân:** File `.env` chưa được tạo hoặc Kong Gateway chưa được mount cấu hình từ `api-gateway/kong.yml` do đường dẫn sai.
*   **Cách khắc phục:**
    *   Kiểm tra xem đã có file `.env` ở thư mục gốc chưa (chứ không phải `.env.example`).
    *   Đảm bảo Kong Container đang chạy: `docker ps | grep kong-gateway`. Nếu chưa chạy, xem log: `docker logs kong-gateway` để kiểm tra lỗi cú pháp trong `kong.yml`.
