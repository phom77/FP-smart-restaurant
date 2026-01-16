import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/api/auth/forgot-password', { email });
            setMessage(res.data.message || 'Đã gửi link đặt lại mật khẩu vào email của bạn.');
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Quên mật khẩu?</h2>
                    <p className="mt-2 text-sm text-gray-600">Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.</p>
                </div>

                {message && <div className="bg-green-50 text-green-700 p-3 rounded mb-4 text-sm border-l-4 border-green-500">{message}</div>}
                {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm border-l-4 border-red-500">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email đăng ký</label>
                        <input
                            type="email"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-blue-400"
                    >
                        {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1">
                        ← Quay lại đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
}