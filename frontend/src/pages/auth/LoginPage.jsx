// frontend/src/pages/auth/LoginPage.jsx
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { claimGuestOrders } from '../../utils/guestOrders';
import api from '../../services/api';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // State quản lý ẩn/hiện

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/api/auth/login', formData);
            if (res.data.success) {
                login(res.data.user, res.data.token);
                await claimGuestOrders(res.data.token);

                const role = res.data.user.role;
                if (role === 'super_admin') navigate('/super-admin');
                else if (role === 'admin') navigate('/admin/dashboard');
                else if (role === 'waiter') navigate('/waiter/orders');
                else if (role === 'kitchen') navigate('/kitchen');
                else navigate('/menu');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-extrabold text-gray-900">Chào mừng trở lại</h2>
                    <p className="mt-2 text-sm text-gray-600">Đăng nhập để quản lý hoặc gọi món.</p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                        <div className="flex">
                            <div className="flex-shrink-0 text-red-500">⚠</div>
                            <div className="ml-3 text-sm text-red-700 font-medium">{error}</div>
                        </div>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            {/* CHECKBOX HIỂN THỊ MẬT KHẨU */}
                            <div className="flex items-center mt-2">
                                <input
                                    id="show-password"
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                    checked={showPassword}
                                    onChange={() => setShowPassword(!showPassword)}
                                />
                                <label htmlFor="show-password" className="ml-2 block text-sm text-gray-900 cursor-pointer select-none">
                                    Hiển thị mật khẩu
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                            Quên mật khẩu?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition duration-200"
                    >
                        {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
                    </button>
                </form>

                <button
                    onClick={() => navigate('/menu')}
                    className="w-full flex justify-center py-2.5 px-4 border border-gray-300 text-sm font-bold rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition duration-200"
                >
                    Khách vãng lai (Xem Menu)
                </button>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Hoặc</span>
                    </div>
                </div>

                <button
                    onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/google`}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-50 transition duration-200 font-medium text-sm"
                >
                     <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5" />
                    Google
                </button>

                <p className="mt-4 text-center text-sm text-gray-600">
                    Chưa có tài khoản?{' '}
                    <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                        Đăng ký ngay
                    </Link>
                </p>
            </div>
        </div>
    );
}