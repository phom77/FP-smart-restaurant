import { useEffect, useState } from 'react';
import api from './services/api';

function App() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Gọi API test
    api.get('/api/categories')
      .then(response => {
        console.log("Data from backend:", response.data);
        setCategories(response.data);
      })
      .catch(error => console.error("Error fetching data:", error));
  }, []);

  return (
    <Routes>
      {/* --- PUBLIC ROUTES (Ai cũng vào được) --- */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<h1>403 - Không có quyền truy cập</h1>} />

      {/* --- CUSTOMER ROUTES (Khách hàng) --- */}
      {/* Có thể yêu cầu login hoặc không tùy logic của bạn */}
      <Route element={<MainLayout />}>
         <Route path="/" element={<HomePage />} />
         <Route path="/menu" element={<MenuPage />} />
      </Route>

      {/* --- ADMIN ROUTES (Chỉ Admin) --- */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
           <Route path="/admin/dashboard" element={<DashboardPage />} />
           <Route path="/admin/menu" element={<ManageMenuPage />} />
        </Route>
      </Route>

      {/* --- STAFF ROUTES (Waiter & Kitchen) --- */}
      <Route element={<ProtectedRoute allowedRoles={['waiter', 'admin']} />}>
         <Route path="/waiter/orders" element={<WaiterOrderPage />} />
      </Route>
      
      <Route element={<ProtectedRoute allowedRoles={['kitchen', 'admin']} />}>
         <Route path="/kitchen/kds" element={<KitchenPage />} />
      </Route>

    </Routes>
  );
}

export default App;