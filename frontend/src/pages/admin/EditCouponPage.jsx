import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function EditCouponPage() {
    const { t } = useTranslation();
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
        is_active: true,
        target_type: 'all',    // Khởi tạo mặc định
        limit_per_user: 1      // Khởi tạo mặc định
    });

    // Helper format ngày cho input datetime-local (Fix lỗi lệch múi giờ +7)
    const formatDateForInput = (isoString) => {
        if (!isoString) return '';

        // Parse ISO string sang Date object (UTC)
        const date = new Date(isoString);

        // Lấy các thành phần theo LOCAL timezone (Vietnam = UTC+7)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        // Format: YYYY-MM-DDTHH:mm (chuẩn datetime-local)
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Load dữ liệu cũ khi vào trang
    useEffect(() => {
        const fetchCoupon = async () => {
            try {
                const res = await api.get(`/api/coupons/${id}`);
                if (res.data.success) {
                    const data = res.data.data;

                    setFormData({
                        ...data,
                        start_date: formatDateForInput(data.start_date),
                        end_date: formatDateForInput(data.end_date),
                        max_discount_value: data.max_discount_value || '',
                        usage_limit: data.usage_limit || '',
                        discount_value: data.discount_value,
                        target_type: data.target_type || 'all',
                        limit_per_user: data.limit_per_user || ''
                    });
                }
            } catch (err) {
                toast.error(t('common.failed'));
                navigate('/admin/coupons');
            } finally {
                setLoading(false);
            }
        };
        fetchCoupon();
    }, [id, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };

            // LOGIC FIX: Nếu chọn 'guest', lập tức xóa limit_per_user vì Guest không định danh được
            if (name === 'target_type' && value === 'guest') {
                newData.limit_per_user = '';
            }

            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate ngày tháng
        if (new Date(formData.end_date) <= new Date(formData.start_date)) {
            return toast.error(t('coupon.validation_date'));
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
                usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
                limit_per_user: formData.target_type === 'guest'
                    ? null
                    : (parseInt(formData.limit_per_user) || null),
                target_type: formData.target_type,
                // ✅ Convert sang ISO string (tự động thêm timezone offset)
                start_date: new Date(formData.start_date).toISOString(),
                end_date: new Date(formData.end_date).toISOString()
            };

            // Gọi API PUT để cập nhật
            const res = await api.put(`/api/coupons/${id}`, payload);
            if (res.data.success) {
                toast.success(t('coupon.update_success'));
                navigate('/admin/coupons');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || t('common.failed'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{t('coupon.edit_title')}</h2>
                        <p className="text-sm text-gray-500">{t('coupon.edit_subtitle')}</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/coupons')}
                        className="text-gray-500 hover:text-gray-700 font-medium text-sm flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-sm">arrow_back</span> {t('coupon.back')}
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* 1. THÔNG TIN CƠ BẢN */}
                    <section>
                        <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">{t('coupon.general_info')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupon.code')}</label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    readOnly
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed font-mono font-bold"
                                />
                                <p className="text-xs text-gray-400 mt-1">{t('coupon.cant_change_code')}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupon.program_name')} <span className="text-red-500">*</span></label>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupon.description')}</label>
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
                        <h3 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-4 border-b pb-2">{t('coupon.discount_setting')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupon.discount_type')} <span className="text-red-500">*</span></label>
                                <select
                                    name="discount_type"
                                    value={formData.discount_type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white h-[42px]"
                                >
                                    <option value="fixed">{t('coupon.fixed')}</option>
                                    <option value="percent">{t('coupon.percent')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {formData.discount_type === 'fixed' ? `${t('coupon.discount')} (VNĐ)` : `${t('coupon.discount')} (%)`} <span className="text-red-500">*</span>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupon.max_discount')} (VNĐ)</label>
                                    <input
                                        type="number"
                                        name="max_discount_value"
                                        value={formData.max_discount_value}
                                        onChange={handleChange}
                                        placeholder="VD: 50000"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        min="0"
                                    />
                                    <p className="text-xs text-orange-500 mt-1">{t('coupon.max_discount_hint')}</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 3. ĐIỀU KIỆN & THỜI GIAN */}
                    <section>
                        <h3 className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-4 border-b pb-2">{t('coupon.conditions')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupon.min_order')} (VNĐ)</label>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupon.usage_limit')}</label>
                                <input
                                    type="number"
                                    name="usage_limit"
                                    value={formData.usage_limit}
                                    onChange={handleChange}
                                    placeholder={t('coupon.unlimited')}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    min="1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupon.start_date')} <span className="text-red-500">*</span></label>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupon.end_date')} <span className="text-red-500">*</span></label>
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

                        {/* --- PHẦN TARGET TYPE & USER LIMIT --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-gray-100">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupon.target_label')}</label>
                                <select
                                    name="target_type"
                                    value={formData.target_type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white h-[42px]"
                                >
                                    <option value="all">{t('coupon.target_all')}</option>
                                    <option value="guest">{t('coupon.target_guest')}</option>
                                    <option value="customer">{t('coupon.target_member')}</option>
                                    <option value="new_user">{t('coupon.target_new')}</option>
                                </select>
                                <p className="text-xs text-gray-400 mt-1">
                                    {formData.target_type === 'guest' && t('coupon.guest_warn')}
                                    {formData.target_type === 'customer' && t('coupon.member_req')}
                                    {formData.target_type === 'new_user' && t('coupon.target_new')}
                                    {formData.target_type === 'all' && t('coupon.target_all')}
                                </p>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-1 ${formData.target_type === 'guest' ? 'text-gray-400' : 'text-gray-700'}`}>
                                    {t('coupon.limit_per_user')}
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        name="limit_per_user"
                                        value={formData.limit_per_user}
                                        onChange={handleChange}
                                        // 🛑 DISABLE NẾU LÀ GUEST
                                        disabled={formData.target_type === 'guest'}
                                        className={`w-full px-4 py-2 border rounded-lg text-center font-bold focus:ring-2 focus:ring-blue-500 ${formData.target_type === 'guest'
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                                            : 'bg-white border-gray-300'
                                            }`}
                                        min="1"
                                        placeholder={formData.target_type === 'guest' ? t('coupon.unlimited') : "1"}
                                    />
                                    <span className={`ml-2 text-sm whitespace-nowrap ${formData.target_type === 'guest' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('coupon.times_per_user')}
                                    </span>
                                </div>
                                {formData.target_type === 'guest' ? (
                                    <p className="text-xs text-orange-500 mt-1 italic">
                                        {t('coupon.guest_warn')}
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-400 mt-1">
                                        ({t('coupon.member_req')})
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 flex items-center p-4 bg-gray-50 rounded-lg">
                            <input
                                type="checkbox"
                                id="is_active"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor="is_active" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer select-none">
                                {t('coupon.active_now')}
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
                            {t('coupon.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg disabled:bg-gray-400 flex items-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {t('coupon.processing')}
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm">save</span>
                                    {t('coupon.save')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}