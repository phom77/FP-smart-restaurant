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
