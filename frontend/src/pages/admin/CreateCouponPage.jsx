import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function CreateCouponPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    // State quản lý dữ liệu form (map đúng với tên cột trong Database)
    const [formData, setFormData] = useState({
        code: '',
        title: '',
        description: '',
        discount_type: 'fixed', // 'fixed' hoặc 'percent'
        discount_value: '',
        min_order_value: 0,
        max_discount_value: '', // Chỉ dùng khi type là percent
        start_date: '',
        end_date: '',
        usage_limit: '', // Để trống là không giới hạn
        is_active: true
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : 
                    name === 'code' ? value.toUpperCase().replace(/\s/g, '') : // Code viết hoa, không dấu cách
                    value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate cơ bản
        if (!formData.code || !formData.title || !formData.discount_value || !formData.start_date || !formData.end_date) {
            return toast.error('Vui lòng điền đầy đủ các trường bắt buộc (*)');
        }

        if (new Date(formData.end_date) <= new Date(formData.start_date)) {
            return toast.error('Ngày kết thúc phải sau ngày bắt đầu');
        }

        setLoading(true);
        try {
            // Chuẩn bị payload (ép kiểu số)
            const payload = {
                ...formData,
                discount_value: parseFloat(formData.discount_value),
                min_order_value: parseFloat(formData.min_order_value) || 0,
                max_discount_value: formData.discount_type === 'percent' && formData.max_discount_value 
                    ? parseFloat(formData.max_discount_value) 
                    : null,
                usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null
            };

            const res = await api.post('/api/coupons/create', payload);
            if (res.data.success) {
                toast.success('🎉 Tạo mã giảm giá thành công!');
                navigate('/admin/coupons'); // Chuyển về trang danh sách (nếu có) hoặc về Dashboard
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi khi tạo mã giảm giá');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Tạo Khuyến Mãi Mới</h2>
                        <p className="text-sm text-gray-500">Thiết lập mã giảm giá cho khách hàng</p>
                    </div>
                    <button 
                        onClick={() => navigate(-1)}
                        className="text-gray-500 hover:text-gray-700 font-medium text-sm flex items-center gap-1"
                    >
                        Quay lại
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* 1. THÔNG TIN CƠ BẢN */}
                    <section>
                        <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">1. Thông tin chung</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mã Voucher <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    placeholder="VD: TET2024 (Tự viết hoa)"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-blue-600 placeholder:font-normal"
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">Mã khách hàng sẽ nhập khi thanh toán</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên chương trình <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="VD: Giảm 20k cho đơn từ 100k"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="2"
                                    placeholder="VD: Áp dụng cho khách hàng ăn tại quán vào khung giờ trưa..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                ></textarea>
                            </div>
                        </div>
                    </section>

                    {/* 2. GIÁ TRỊ GIẢM GIÁ */}
                    <section>
                        <h3 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-4 border-b pb-2">2. Thiết lập giảm giá</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm <span className="text-red-500">*</span></label>
                                <select
                                    name="discount_type"
                                    value={formData.discount_type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="fixed">Tiền mặt (VNĐ)</option>
                                    <option value="percent">Phần trăm (%)</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {formData.discount_type === 'fixed' ? 'Số tiền giảm (VNĐ)' : 'Phần trăm giảm (%)'} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="discount_value"
                                    value={formData.discount_value}
                                    onChange={handleChange}
                                    placeholder={formData.discount_type === 'fixed' ? "VD: 20000" : "VD: 10"}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                    min="0"
                                    required
                                />
                            </div>

                            {/* Chỉ hiện ô này nếu chọn loại là Phần trăm */}
                            {formData.discount_type === 'percent' && (
                                <div className="animate-fade-in">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giảm tối đa (VNĐ)</label>
                                    <input
                                        type="number"
                                        name="max_discount_value"
                                        value={formData.max_discount_value}
                                        onChange={handleChange}
                                        placeholder="VD: 50000 (Tránh giảm quá sâu)"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        min="0"
                                    />
                                    <p className="text-xs text-orange-500 mt-1">Để trống nếu không giới hạn</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 3. ĐIỀU KIỆN & THỜI GIAN */}
                    <section>
                        <h3 className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-4 border-b pb-2">3. Điều kiện áp dụng</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Đơn hàng tối thiểu (VNĐ)</label>
                                <input
                                    type="number"
                                    name="min_order_value"
                                    value={formData.min_order_value}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn số lượng dùng</label>
                                <input
                                    type="number"
                                    name="usage_limit"
                                    value={formData.usage_limit}
                                    onChange={handleChange}
                                    placeholder="VD: 100 (Để trống = Vô hạn)"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    min="1"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu <span className="text-red-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc <span className="text-red-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center">
                            <input
                                type="checkbox"
                                id="is_active"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700 font-medium cursor-pointer">
                                Kích hoạt voucher ngay sau khi tạo
                            </label>
                        </div>
                    </section>

                    {/* BUTTONS */}
                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/coupons')}
                            className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition shadow-lg disabled:bg-gray-400 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    Tạo Mã Ngay
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}