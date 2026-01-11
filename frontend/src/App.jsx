import { Routes, Route, Navigate } from 'react-router-dom'; // Bỏ BrowserRouter ở đây
import MenuPage from './pages/customer/MenuPage';
import LoginPage from './pages/auth/LoginPage';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminSidebar from './pages/admin/AdminSidebar';
import MenuManagement from './pages/admin/MenuManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import './App.css';

function App() {
  return (
    // Xóa thẻ <BrowserRouter> bao quanh, chỉ giữ lại <Routes>
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/login" element={<LoginPage />} />


      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminSidebar />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<div>Dashboard Placeholder</div>} />
          <Route path="menu" element={<MenuManagement />} />
          <Route path="categories" element={<CategoryManagement />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;