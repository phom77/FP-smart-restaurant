import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function EditCouponPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // State quản lý dữ liệu form
    const [formData, setFormData] = useState({
        code: '',
        title: '',
        description: '',
        discount_type: 'fixed',
        discount_value: '',
        min_order_value: 0,
        max_discount_value: '',
        start_date: '',
        end_date: '',
        usage_limit: '',
        is_active: true
    });

    // Load dữ liệu cũ khi vào trang
    useEffect(() => {
        const fetchCoupon = async () => {
            try {
                const res = await api.get(`/api/coupons/${id}`);
                if (res.data.success) {
                    const data = res.data.data;
                    
                    // Helper format ngày cho input datetime-local (YYYY-MM-DDTHH:mm)
                    const formatDate = (dateString) => {
                        if (!dateString) return '';
                        const date = new Date(dateString);
                        // Cần trừ đi Timezone offset hoặc dùng toISOString().slice(0, 16) nếu server trả về UTC chuẩn
                        // Cách đơn giản nhất để hiện đúng giờ local trên input:
                        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                    };
                    
                    setFormData({
                        ...data,
                        start_date: formatDate(data.start_date),
                        end_date: formatDate(data.end_date),
                        max_discount_value: data.max_discount_value || '',
                        usage_limit: data.usage_limit || '',
                        // discount_value có thể trả về string hoặc number, ép về string để hiện trên input
                        discount_value: data.discount_value
                    });
                }
            } catch (err) {
                toast.error('Không tìm thấy voucher');
                navigate('/admin/coupons');
            } finally {
                setLoading(false);
            }
        };
        fetchCoupon();
    }, [id, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate ngày tháng
        if (new Date(formData.end_date) <= new Date(formData.start_date)) {
            return toast.error('Ngày kết thúc phải sau ngày bắt đầu');
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                discount_value: parseFloat(formData.discount_value),
                min_order_value: parseFloat(formData.min_order_value) || 0,
                max_discount_value: formData.discount_type === 'percent' && formData.max_discount_value 
                    ? parseFloat(formData.max_discount_value) 
                    : null,
                usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null
            };

            // Gọi API PUT để cập nhật
            const res = await api.put(`/api/coupons/${id}`, payload);
            if (res.data.success) {
                toast.success('Cập nhật voucher thành công!');
                navigate('/admin/coupons');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi cập nhật');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Chỉnh Sửa Voucher</h2>
                        <p className="text-sm text-gray-500">Cập nhật thông tin chương trình khuyến mãi</p>
                    </div>
                    <button 
                        onClick={() => navigate('/admin/coupons')}
                        className="text-gray-500 hover:text-gray-700 font-medium text-sm flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-sm">arrow_back</span> Quay lại
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* 1. THÔNG TIN CƠ BẢN */}
                    <section>
                        <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">1. Thông tin chung</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mã Voucher</label>
                                {/* Input Code bị Disabled vì không nên sửa mã Code (ảnh hưởng lịch sử đơn hàng) */}
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    readOnly
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed font-mono font-bold"
                                />
                                <p className="text-xs text-gray-400 mt-1">Không thể thay đổi Mã code</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên chương trình <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                                <textarea
                                    name="description"
                                    value={formData.description || ''}
                                    onChange={handleChange}
                                    rows="2"
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
                                        placeholder="VD: 50000"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        min="0"
                                    />
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn số lượng</label>
                                <input
                                    type="number"
                                    name="usage_limit"
                                    value={formData.usage_limit}
                                    onChange={handleChange}
                                    placeholder="Để trống = Vô hạn"
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

                        <div className="mt-4 flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <input
                                type="checkbox"
                                id="is_active"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor="is_active" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer select-none">
                                Đang kích hoạt (Cho phép sử dụng voucher này)
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
                            disabled={submitting}
                            className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg disabled:bg-gray-400 flex items-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm">save</span>
                                    Lưu Thay Đổi
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}