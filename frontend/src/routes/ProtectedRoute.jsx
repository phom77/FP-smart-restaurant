import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// allowedRoles: mảng các quyền được phép vào (ví dụ ['admin'])
const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  // 1. Chưa đăng nhập -> Đá về trang Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Có đăng nhập nhưng sai quyền (VD: Customer đòi vào trang Admin)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />; // Bạn cần tạo trang Unauthorized nhé
  }

  // 3. Hợp lệ -> Cho hiện nội dung bên trong
  return <Outlet />;
};

export default ProtectedRoute;