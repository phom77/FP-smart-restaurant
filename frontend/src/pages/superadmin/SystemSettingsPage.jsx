import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function SystemSettingsPage() {
    const [settings, setSettings] = useState({
        restaurant_name: '',
        currency: '',
        vat_rate: '',
        wifi_password: '',
        open_time: '',
        close_time: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load settings khi vào trang
        const fetchSettings = async () => {
            try {
                const res = await api.get('/api/system/settings');
                if (res.data.success) {
                    setSettings(prev => ({ ...prev, ...res.data.data }));
                }
            } catch (err) {
                toast.error('Không thể tải cấu hình');
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.put('/api/system/settings', settings);
            if (res.data.success) {
                toast.success('Cập nhật cấu hình thành công!');
            }
        } catch (err) {
            toast.error('Lỗi khi lưu cấu hình');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="mb-8 border-b border-gray-100 pb-4">
                    <h2 className="text-xl font-bold text-gray-800">Cấu hình Hệ thống</h2>
                    <p className="text-sm text-gray-500">Các thiết lập này sẽ áp dụng cho toàn bộ ứng dụng và Admin nhà hàng.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Thông tin cơ bản */}
                    <section>
                        <h3 className="text-md font-semibold text-blue-600 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined">storefront</span> Thông tin Nhà hàng
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Nhà Hàng</label>
                                <input name="restaurant_name" value={settings.restaurant_name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu WiFi</label>
                                <input name="wifi_password" value={settings.wifi_password} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none" />
                            </div>
                        </div>
                    </section>

                    {/* Tài chính & Vận hành */}
                    <section>
                        <h3 className="text-md font-semibold text-blue-600 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined">payments</span> Tài chính & Vận hành
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị tiền tệ</label>
                                <input name="currency" value={settings.currency} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Thuế VAT (%)</label>
                                <input name="vat_rate" type="number" value={settings.vat_rate} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ mở cửa</label>
                                <input name="open_time" type="time" value={settings.open_time} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ đóng cửa</label>
                                <input name="close_time" type="time" value={settings.close_time} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none" />
                            </div>
                        </div>
                    </section>

                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition shadow-lg disabled:bg-gray-400"
                        >
                            {loading ? 'Đang lưu...' : 'Lưu Cấu Hình'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}