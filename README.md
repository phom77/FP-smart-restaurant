# 🍽️ Smart Restaurant - QR Menu & Ordering System

Dự án phát triển hệ thống gọi món tại bàn bằng mã QR.
**Team:** [Tên nhóm của bạn]
**Môn học:** Web Application Development (WAD)

---

## 🛠 Tech Stack

* **Frontend:** React (Vite)
* **Backend:** Node.js (Express)
* **Database:** PostgreSQL (Supabase)
* **Environment:** Docker & Docker Compose (Chạy trên WSL2)

---

## ⚙️ Yêu cầu cài đặt (Prerequisites)

Tất cả thành viên nhóm **BẮT BUỘC** phải cài đặt các công cụ sau trên Windows:

1. **WSL2 (Windows Subsystem for Linux):** Đã cài Ubuntu.
2. **Docker Desktop:** Đã bật setting "Use WSL 2 based engine" và bật Integration cho Ubuntu.
3. **VS Code:** Đã cài extension **"Remote - WSL"**.
4. **Git:** Cài đặt trong WSL.

> ⚠️ **Lưu ý:** Tuyệt đối clone code vào thư mục của Linux (Ví dụ: `~/smart-restaurant`), **KHÔNG** clone vào ổ C hoặc D của Windows để tránh lỗi permission và chạy chậm.

---

## 🚀 Hướng dẫn chạy dự án (Getting Started)

### 1. Clone dự án (Làm 1 lần đầu)

Mở Terminal của WSL (Ubuntu) và chạy:

```bash
# Clone repo về thư mục Home của Linux
cd ~
git clone https://github.com/<username>/smart-restaurant.git
cd smart-restaurant
```

### 2. Cài đặt biến môi trường

Tạo file `.env` ở thư mục backend (Copy từ file mẫu nếu có, hoặc tự tạo):

```bash
# Trong file backend/.env
PORT=5001
DATABASE_URL="postgres://..."  # Lấy link này từ Supabase Dashboard
```

### 3. Cài đặt thư viện & Build Docker

Chạy lệnh sau để cài node_modules và build images:

```bash
make setup
make dev
```

Sau khi thấy thông báo "Server running..." và "Local: [http://localhost:5173](http://localhost:5173)", hãy mở trình duyệt:

* **Frontend:** [http://localhost:5173](http://localhost:5173)
* **Backend:** [http://localhost:5001](http://localhost:5001)

---

## 📦 Quy trình thêm thư viện mới (Quan trọng)

Khi code, nếu cần cài thêm gói (ví dụ axios, date-fns...), hãy làm theo đúng quy trình sau để không làm lỗi máy của thành viên khác:

### Bước 1: Dừng Docker

Bấm `Ctrl + C` hoặc chạy:

```bash
make stop
```

### Bước 2: Cài thư viện vào thư mục tương ứng

Dùng terminal WSL, cd vào đúng thư mục và cài đặt:

```bash
# Ví dụ cài axios cho frontend
cd frontend
npm install axios
```

### Bước 3: Rebuild lại Docker

Sau khi cài xong, quay lại thư mục gốc và chạy lại Docker với cờ build để container cập nhật thư viện mới:

```bash
cd ..
make update
```


### Bước 4: Commit file package.json

Nhớ commit cả 2 file `package.json` và `package-lock.json` lên Git.

🚨 **Đối với thành viên khác:** Khi pull code về, nếu thấy đồng đội có update file `package.json`, hãy chạy ngay `make setup` để máy mình cập nhật thư viện mới.

---

## 🤝 Quy trình Git (Workflow)

Chúng ta tuân thủ quy trình sau để tránh conflict code:

* **Main Branch:** Chỉ chứa code sạch, đã test, có thể nộp bài. **KHÔNG** push trực tiếp vào main.
* **Dev Branch:** Nhánh phát triển chung.
* **Feature Branches:** Mỗi khi làm tính năng mới, hãy tạo nhánh từ dev:

  * Đặt tên nhánh: `feature/<tên-tính-năng>` (ví dụ: `feature/login-ui`, `feature/api-menu`).
  * Code xong → Push lên Github → Tạo Pull Request (PR) vào nhánh dev.
  * Review code xong mới Merge.

---

## 🛠 Các lệnh thường dùng (Makefile)

| Lệnh         | Tác dụng                                                     |
| ------------ | ------------------------------------------------------------ |
| `make dev`   | Khởi động toàn bộ dự án (Frontend + Backend + DB)            |
| `make setup` | Cài đặt node_modules (Chạy khi mới clone hoặc pull code mới) |
| `make stop`  | Tắt toàn bộ container                                        |
| `make clean` | Xóa sạch container và images (Dùng khi lỗi nặng cần reset)   |

---
