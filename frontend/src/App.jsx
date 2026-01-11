import { Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './pages/customer/MenuPage';
import CartPage from './pages/customer/CartPage';
import OrderTrackingPage from './pages/customer/OrderTrackingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminSidebar from './pages/admin/AdminSidebar';
import MenuManagement from './pages/admin/MenuManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import RevenuePage from './pages/admin/RevenuePage'; // Import RevenuePage
import WaiterLayout from './layouts/WaiterLayout'; // Import WaiterLayout
import OrderListPage from './pages/waiter/OrderListPage'; // Import OrderListPage
import TableMapPage from './pages/waiter/TableMapPage'; // Import TableMapPage
import KitchenDisplayPage from './pages/kitchen/KitchenDisplayPage';
import './App.css';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/orders/:orderId" element={<OrderTrackingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminSidebar />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<div>Dashboard Placeholder</div>} />
          <Route path="menu" element={<MenuManagement />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="revenue" element={<RevenuePage />} />
        </Route>
      </Route>

      {/* Waiter Routes */}
      <Route element={<ProtectedRoute allowedRoles={['waiter', 'admin']} />}>
        <Route path="/waiter" element={<WaiterLayout />}>
          <Route index element={<Navigate to="orders" replace />} />
          <Route path="orders" element={<OrderListPage />} />
          <Route path="map" element={<TableMapPage />} />
        </Route>
      </Route>

      {/* --- KITCHEN ROUTES (Bếp & Admin) --- */}
      <Route element={<ProtectedRoute allowedRoles={['kitchen', 'admin']} />}>
        <Route path="/kitchen" element={<KitchenDisplayPage />} />
      </Route>

    </Routes>
  );
}

export default App;