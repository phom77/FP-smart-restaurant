import { Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './pages/customer/MenuPage';
import CartPage from './pages/customer/CartPage';
import OrderTrackingPage from './pages/customer/OrderTrackingPage';
import MyOrdersPage from './pages/customer/MyOrdersPage';
import ProfilePage from './pages/customer/ProfilePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import GoogleCallback from './pages/auth/GoogleCallback';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminSidebar from './pages/admin/AdminSidebar';
import MenuManagement from './pages/admin/MenuManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import RevenuePage from './pages/admin/RevenuePage'; // Import RevenuePage
import WaiterLayout from './layouts/WaiterLayout'; // Import WaiterLayout
import OrderListPage from './pages/waiter/OrderListPage'; // Import OrderListPage
import TableMapPage from './pages/waiter/TableMapPage'; // Import TableMapPage
import KitchenDisplayPage from './pages/kitchen/KitchenDisplayPage';
import CheckoutPage from './pages/customer/CustomerCheckoutPage'; // <-- Đảm bảo file này tồn tại
import WaiterBillPage from './pages/waiter/WaiterBillPage';
import GuestActiveOrdersBanner from './components/customer/GuestActiveOrdersBanner'; // Import Banner
import './App.css';

function App() {
  return (
    <>
      <GuestActiveOrdersBanner /> {/* Persistent Banner for Guests */}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders/:orderId" element={<OrderTrackingPage />} />
        <Route path="/my-orders" element={<MyOrdersPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/profile" element={<ProfilePage />} />

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
            <Route path="bill/:orderId" element={<WaiterBillPage />} />
            <Route path="map" element={<TableMapPage />} />
          </Route>
        </Route>

        {/* --- KITCHEN ROUTES (Bếp & Admin) --- */}
        <Route element={<ProtectedRoute allowedRoles={['kitchen', 'admin']} />}>
          <Route path="/kitchen" element={<KitchenDisplayPage />} />
        </Route>

      </Routes>
    </>
  );
}

export default App;