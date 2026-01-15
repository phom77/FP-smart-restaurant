// frontend/src/pages/auth/RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Mật khẩu nhập lại không khớp!');
        }

        setLoading(true);
        try {
            // Loại bỏ confirmPassword trước khi gửi
            const { confirmPassword, ...dataToSend } = formData;
            const res = await api.post('/api/auth/register', dataToSend);
            
            if (res.data.success) {
                setSuccess(res.data.message || 'Đăng ký thành công! Vui lòng kiểm tra email.');
                // Xóa form
                setFormData({ full_name: '', email: '', phone: '', password: '', confirmPassword: '' });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 font-sans">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900">Tạo tài khoản mới</h2>
                    <p className="mt-2 text-sm text-gray-600">Đăng ký để nhận ưu đãi và quản lý đơn hàng.</p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-sm text-red-700">
                        {error}
                    </div>
                )}
                
                {success && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md text-sm text-green-700">
                        {success}
                    </div>
                )}

                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                        <input name="full_name" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="Nguyễn Văn A" value={formData.full_name} onChange={handleChange} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input name="email" type="email" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="name@example.com" value={formData.email} onChange={handleChange} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                        <input name="phone" type="tel" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="0901234567" value={formData.phone} onChange={handleChange} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                        <input name="password" type="password" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="••••••••" value={formData.password} onChange={handleChange} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nhập lại mật khẩu</label>
                        <input name="confirmPassword" type="password" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition duration-200 mt-6"
                    >
                        {loading ? 'Đang xử lý...' : 'Đăng Ký'}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600">
                    Đã có tài khoản?{' '}
                    <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
}