# Hướng dẫn Kiểm thử Tự động E2E với Playwright (BICAP)

Tài liệu này cung cấp hướng dẫn chi tiết về cách cài đặt, viết mới, thực thi và xem báo cáo kiểm thử tự động giao diện (End-to-End - E2E) bằng framework **Playwright** trong dự án BICAP.

---

## 1. Giới thiệu tổng quan
Playwright là framework kiểm thử E2E hiện đại và mạnh mẽ, cho phép chúng ta kiểm tra toàn bộ luồng hoạt động của người dùng (từ đăng nhập, thao tác đến lưu trữ dữ liệu blockchain) trên môi trường trình duyệt thực tế (Chromium, Firefox, WebKit).

Trong dự án BICAP, Playwright được tích hợp tập trung tại thư mục gốc để quản lý và kiểm thử đồng thời cả 5 ứng dụng web:
* **Guest Web** (Cổng khách vãng lai) - Port `3405`
* **Retailer Web** (Nhà bán lẻ) - Port `3400`
* **Admin Web** (Quản trị viên) - Port `3401`
* **Farm Management Web** (Quản lý nông trại) - Port `3402`
* **Shipping Manager Web** (Quản lý vận chuyển) - Port `3403`

---

## 2. Hướng dẫn cài đặt Locally

### Điều kiện tiên quyết:
* Đã cài đặt **Node.js** phiên bản 18 trở lên.

### Các bước cài đặt:
1. Di chuyển vào thư mục gốc của dự án `BICAP-main`.
2. Chạy lệnh cài đặt các package phụ thuộc:
   ```bash
   npm install
   ```
3. Cài đặt các trình duyệt kiểm thử của Playwright và thư viện hệ thống cần thiết:
   ```bash
   npx playwright install chromium --with-deps
   ```

---

## 3. Cách thực thi kiểm thử (Run Tests)

Dự án cung cấp nhiều chế độ chạy test linh hoạt tùy thuộc vào nhu cầu phát triển và debug:

### Chạy chế độ ngầm (Headless Mode) - Phù hợp chạy CI/CD
Chạy toàn bộ các test cases một cách nhanh chóng không hiển thị giao diện trình duyệt:
```bash
npm run qa:playwright
```

### Chạy với giao diện tương tác (UI Mode) - Khuyên dùng khi phát triển
Giao diện trực quan cho phép bạn xem trực tiếp quá trình click, nhập liệu, xem lịch sử các bước (Time-travel debugging):
```bash
npx playwright test --ui
```

### Chạy và debug từng dòng lệnh (Debug Mode)
Mở trình duyệt cùng với bộ công cụ Playwright Inspector để đi từng bước qua dòng code:
```bash
npx playwright test --debug
```

### Chạy một tệp test hoặc test case cụ thể
```bash
# Chạy duy nhất tệp login test
npx playwright test qa/playwright/tests/frontend-login.spec.js

# Chạy các test chứa từ khóa "Guest" trong tên
npx playwright test -g "Guest"
```

---

## 4. Cách xem báo cáo kết quả (HTML Report)

Sau khi chạy xong test ở chế độ headless, Playwright sẽ tự động xuất ra một báo cáo định dạng HTML vô cùng chi tiết.

* **Đường dẫn báo cáo:** `qa/reports/playwright-report/index.html`
* **Cách mở báo cáo xem trực tiếp:**
  ```bash
  npx playwright show-report qa/reports/playwright-report
  ```
Báo cáo này hiển thị chi tiết:
* Trạng thái Pass/Fail của từng test case.
* Thời gian thực thi.
* **Ảnh chụp màn hình (Screenshot)** tại bước bị lỗi (nếu test bị fail).
* Trace logs chi tiết để hỗ trợ debug.

---

## 5. Hướng dẫn viết Test Case mới

Các tệp test mới phải được đặt trong thư mục `qa/playwright/tests/` và có đuôi `.spec.js`.

### Cấu trúc một tệp test tiêu chuẩn:
```javascript
const { test, expect } = require('@playwright/test');

// Đọc cấu hình host và port từ biến môi trường
const host = process.env.QA_BASE_HOST || '127.0.0.1';
const guestPort = process.env.GUEST_WEB_PORT || '3405';

test.describe('Nhóm các kiểm thử liên quan đến Khách hàng', () => {

  // Test case đăng nhập
  test('Khách truy cập trang đăng nhập thành công', async ({ page }) => {
    // 1. Điều hướng tới URL
    await page.goto(`http://${host}:${guestPort}/login`);

    // 2. Thực hiện hành động (nhập liệu, bấm nút)
    await page.locator('input[name="email"]').fill('customer@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // 3. Khẳng định kết quả mong đợi (Assertion)
    await expect(page).toHaveURL(new RegExp(`http://${host}:${guestPort}/dashboard`));
    await expect(page.locator('.welcome-message')).toContainText('Xin chào');
  });

});
```

---

## 6. Tích hợp trong Jenkins CI/CD
Playwright đã được tích hợp sẵn trong tệp `Jenkinsfile` ở stage **`Frontend QA`**. 

Khi chạy trên máy chủ CI/CD:
1. Jenkins tự động chạy lệnh cài đặt môi trường và tải trình duyệt Chromium tương ứng.
2. Thực thi kiểm thử bằng lệnh `npx playwright test`.
3. Nếu có bất kỳ test case nào thất bại, Jenkins sẽ dừng build, xuất log lỗi, tự động tạo/comment bug lên **Jira** và lưu trữ thư mục báo cáo `qa/reports/playwright-report/` làm artifact của lượt build để hỗ trợ dev tải về xem chi tiết lỗi.
