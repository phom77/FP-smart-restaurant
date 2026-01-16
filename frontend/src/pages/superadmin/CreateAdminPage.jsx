import { useState } from 'react';
import api from '../../services/api';

export default function CreateAdminPage() {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        restaurant_name: 'Smart Restaurant'
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', content: '' });

        try {
            const res = await api.post('/api/super-admin/create-admin', formData);
            if (res.data.success) {
                setMessage({ type: 'success', content: 'Tạo tài khoản Chủ nhà hàng thành công! Email thông báo đã được gửi.' });
                setFormData({ full_name: '', email: '', phone: '', password: '', restaurant_name: '' });
            }
        } catch (err) {
            setMessage({ type: 'error', content: err.response?.data?.message || 'Có lỗi xảy ra.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-800">Cấp tài khoản Chủ Nhà Hàng</h2>
                    <p className="text-sm text-gray-500">Tạo tài khoản Admin quản lý và thiết lập tên nhà hàng.</p>
                </div>

                {message.content && (
                    <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {message.content}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên chủ quán</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email đăng nhập</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu khởi tạo</label>
                            <input
                                type="text" // Để text cho dễ nhìn khi cấp
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                                placeholder="VD: Restaurant@2024"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên nhà hàng (Hiển thị trên hệ thống)</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={formData.restaurant_name}
                            onChange={e => setFormData({ ...formData, restaurant_name: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm disabled:bg-gray-400"
                        >
                            {loading ? 'Đang tạo...' : 'Tạo tài khoản & Gửi mail'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}