# 📂 Hướng dẫn cấu trúc Frontend & Phân quyền

Tài liệu này quy định nơi đặt code và cách tạo trang mới để đảm bảo tính bảo mật và gọn gàng cho dự án.

## 1. Cấu trúc thư mục Pages (`frontend/src/pages`)

Chúng ta chia màn hình (Page) dựa theo **Vai trò người dùng (Role)**. Bạn phụ trách role nào thì chỉ làm việc trong thư mục đó.

```text
src/pages/
├── auth/           # Đăng nhập, Đăng ký, Quên mật khẩu (Dùng chung)
├── customer/       # Giao diện Khách hàng (Menu, Giỏ hàng, Thanh toán)
├── admin/          # Giao diện Quản lý (Dashboard, Quản lý món, Bàn)
├── waiter/         # Giao diện Phục vụ (Xem order, Bưng món)
├── kitchen/        # Giao diện Bếp (Xem món cần nấu)
└── common/         # Các trang chung (404 Not Found, 403 Forbidden)
```

## 2. Quy tắc Phân quyền (Routing Permission)

Khi bạn tạo một trang mới, bạn phải khai báo nó trong App.jsx và BẮT BUỘC bọc nó trong ProtectedRoute nếu trang đó cần đăng nhập.

Ví dụ: Bạn tạo trang "Thêm món ăn" cho Admin

**Bước 1:** Tạo file `src/pages/admin/AddFoodPage.jsx`.

**Bước 2:** Vào App.jsx khai báo route:

```jsx
// App.jsx
import AddFoodPage from './pages/admin/AddFoodPage';

// ... bên trong return <Routes> ...

{/* ❌ SAI: Để tơ hơ thế này ai cũng vào được */}
<Route path="/admin/add-food" element={<AddFoodPage />} />

{/* ✅ ĐÚNG: Phải bọc trong ProtectedRoute với role 'admin' */}
<Route element={<ProtectedRoute allowedRoles={['admin']} />}>
    <Route path="/admin/add-food" element={<AddFoodPage />} />
</Route>
```

## 3. Cách lấy thông tin User đang đăng nhập

Trong bất kỳ component nào, nếu bạn muốn biết user này là ai, ID bao nhiêu, Role gì, hãy dùng hook `useAuth`.

```jsx
import { useAuth } from '../contexts/AuthContext';

export default function SomePage() {
  const { user, logout } = useAuth();

  // user object sẽ có dạng: { id: "...", email: "...", role: "admin", ... }

  if (!user) return <p>Chưa đăng nhập</p>;

  return (
    <div>
      <h1>Xin chào, {user.full_name}</h1>
      <p>Vai trò của bạn là: {user.role}</p>
      
      {/* Logic hiển thị theo quyền */}
      {user.role === 'admin' && <button>Xóa User này</button>}
      
      <button onClick={logout}>Đăng xuất</button>
    </div>
  );
}
```
