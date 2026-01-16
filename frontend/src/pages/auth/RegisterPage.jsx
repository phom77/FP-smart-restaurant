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

    // 👇 1. THÊM HÀM VALIDATE MẬT KHẨU
    const validatePasswordStrong = (pass) => {
        // Ít nhất 8 ký tự, 1 hoa, 1 thường, 1 số, 1 ký tự đặc biệt
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(pass);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // 👇 2. CHECK MẬT KHẨU KHỚP
        if (formData.password !== formData.confirmPassword) {
            return setError('Mật khẩu nhập lại không khớp!');
        }

        // 👇 3. CHECK ĐỘ MẠNH MẬT KHẨU (QUAN TRỌNG)
        if (!validatePasswordStrong(formData.password)) {
            return setError('Mật khẩu quá yếu! Yêu cầu: Tối thiểu 8 ký tự, bao gồm chữ Hoa, chữ thường, Số và Ký tự đặc biệt (@$!%*?&).');
        }

        setLoading(true);
        try {
            const { confirmPassword, ...dataToSend } = formData;
            const res = await api.post('/api/auth/register', dataToSend);
            
            if (res.data.success) {
                setSuccess(res.data.message || 'Đăng ký thành công! Vui lòng kiểm tra email.');
                setFormData({ full_name: '', email: '', phone: '', password: '', confirmPassword: '' });
            }
        } catch (err) {
            // Hiển thị lỗi từ Backend trả về (nếu hacker bypass frontend)
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
                    {/* ... (Các ô input Fullname, Email, Phone giữ nguyên) ... */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                        <input name="full_name" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Nguyễn Văn A" value={formData.full_name} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input name="email" type="email" required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" placeholder="name@example.com" value={formData.email} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                        <input name="phone" type="tel" required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" placeholder="0901234567" value={formData.phone} onChange={handleChange} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                        <input 
                            name="password" 
                            type="password" 
                            required 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none font-mono" 
                            placeholder="VD: StrongP@ss1" 
                            value={formData.password} 
                            onChange={handleChange} 
                            title="Tối thiểu 8 ký tự, 1 Hoa, 1 thường, 1 số, 1 ký tự đặc biệt"
                        />
                        <p className="text-xs text-gray-400 mt-1">Yêu cầu: 8+ ký tự, Hoa, Thường, Số, Ký tự đặc biệt.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nhập lại mật khẩu</label>
                        <input name="confirmPassword" type="password" required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none font-mono" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} />
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