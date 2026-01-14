# Project Updates - Port Configuration

## [2026-01-08] Backend Port Change

The backend server port has been changed from `5000` to `5001`.

### Reason
- Updated as per user request (possibly to avoid conflicts with other services like Control Center or system services often running on 5000 on macOS).

### Changes
1.  **Backend Config**: `backend/src/index.js` default port updated to `5001`.
2.  **Docker**: `docker-compose.yml` backend service now maps `5001:5001` and sets `PORT=5001`.
3.  **Frontend Config**: `frontend/src/services/api.js` points to `http://localhost:5001` as fallback.
4.  **Documentation**: `README.md` and `docs/api_endpoints.md` updated to reflect the new API base URL.

### Action Required
run `make stop` and `make dev` to apply changes.

---

## [2026-01-13] Member 3: Analytics Seeding & Cleanup

Hướng dẫn tạo và xóa dữ liệu giả để kiểm tra các tính năng báo cáo (Analytics).

### 1. Tạo Dữ liệu (Seeding)
Tạo 150 đơn hàng giả có quy luật (giờ cao điểm, cuối tuần) để test biểu đồ.
```bash
# Thực hiện tại thư mục backend
node src/scripts/seedAnalytics.js
```

### 2. Xóa Dữ liệu (Cleanup)
Xóa sạch 150 đơn hàng giả đã tạo (không ảnh hưởng dữ liệu thật).
```bash
# Thực hiện tại thư mục backend
node src/scripts/cleanupAnalytics.js
```

---

## [2026-01-14] Member 3: Cập nhật API Endpoints Specification

Chuẩn hóa và bổ sung các API phục vụ Phase 4 (QR, Staff, Analytics).

### Các thay đổi chính:
1.  **Prefix chuẩn hóa**: Tất cả các đường dẫn trong tài liệu được cập nhật thêm tiền tố `/api` để khớp với thực tế triển khai (Source of Truth).
2.  **Staff Management**: Tách biệt rõ rệt giữa `/auth` và `/admin/staff`. Bổ sung các endpoint CRUD nhân sự hoàn chỉnh, bao gồm cả việc hợp nhất sửa thông tin và mật khẩu vào `PUT /api/admin/staff/:id`.
3.  **Table & QR**:
    *   Bổ sung trường `location` (Vị trí) vào thông tin bàn.
    *   Thêm endpoint `GET /api/tables/:id` để lấy chi tiết 1 bàn.
    *   Thêm endpoint `PATCH /api/tables/:id/status` để nhân viên/admin cập nhật nhanh trạng thái bàn.
    *   Thêm endpoint `GET /api/tables/:id/qr` để lấy ảnh QR Code trực tiếp (Base64).
    *   Thêm endpoint `GET /api/tables/:id/qr/pdf` để xuất mã QR chuyên nghiệp ra file PDF.
    *   Thêm endpoint `POST /api/tables/:id/qr/regenerate` để làm mới token bảo mật cho từng bàn.
    *   Thêm endpoint `POST /api/tables/qr/regenerate-all` để làm mới TOÀN BỘ token QR của nhà hàng chỉ với 1 click.
4.  **Analytics**: Bổ sung endpoint xuất báo cáo Excel nâng cao (Detailed Orders).

### Mục đích:
- Đảm bảo tài liệu API là **Duy nhất** và **Chính xác** để Frontend và Backend kết nối không lỗi.
- Hỗ trợ tốt hơn cho việc kiểm thử (Postman) và bảo mật (RBAC).
