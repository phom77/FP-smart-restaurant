import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api'; // Axios instance đã cấu hình

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Gọi API thật
            const res = await api.post('/api/auth/login', formData);

            if (res.data.success) {
                // Lưu token và user vào Context
                login(res.data.user, res.data.token);

                // Điều hướng dựa trên Role
                if (res.data.user.role === 'admin') navigate('/admin/dashboard');
                else if (res.data.user.role === 'waiter') navigate('/waiter/orders');
                else navigate('/menu'); // Customer về trang menu
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Đăng Nhập</h2>

                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            required
                            className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                        <input
                            type="password"
                            required
                            className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                    >
                        {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600">
                    Chưa có tài khoản? <Link to="/register" className="text-blue-600 hover:underline">Đăng ký ngay</Link>
                </p>
            </div>
        </div>
    );
}