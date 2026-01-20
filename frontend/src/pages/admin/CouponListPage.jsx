import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function CouponListPage() {
    const { t } = useTranslation();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;
    const navigate = useNavigate();

    const fetchCoupons = async (page = currentPage, showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const res = await api.get(`/api/coupons/admin/all?page=${page}&limit=${itemsPerPage}`);
            if (res.data.success) {
                setCoupons(res.data.data);
                setTotalPages(res.data.pagination?.totalPages || 1);
                setTotalItems(res.data.pagination?.total || 0);
            }
        } catch (err) {
            toast.error(t('common.failed'));
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            fetchCoupons(newPage, false);
        }
    };

    useEffect(() => { fetchCoupons(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm(t('coupon.delete_confirm'))) return;
        try {
            const res = await api.delete(`/api/coupons/${id}`);
            if (res.data.success) {
                toast.success(t('coupon.delete_success'));
                fetchCoupons();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || t('coupon.delete_error'));
        }
    };

    // Helper để hiển thị tên đối tượng cho đẹp
    const getTargetLabel = (type) => {
        switch (type) {
            case 'new_user': return t('coupon.target_new');
            case 'guest': return t('coupon.target_guest');
            case 'customer': return t('coupon.target_member');
            default: return t('coupon.target_all');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">{t('coupon.list_title')}</h2>
                    <p className="text-sm text-gray-500">{t('coupon.list_subtitle')}</p>
                </div>
                <button
                    onClick={() => navigate('/admin/coupons/create')}
                    className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm"
                >
                    <span className="material-symbols-outlined text-sm">add</span> {t('coupon.create_btn')}
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 border-b text-left text-gray-600 font-semibold">{t('coupon.code')}</th>
                            <th className="p-4 border-b text-center text-gray-600 font-semibold">{t('coupon.discount')}</th>
                            <th className="p-4 border-b text-center text-gray-600 font-semibold">{t('coupon.duration')}</th>
                            <th className="p-4 border-b text-center text-gray-600 font-semibold">{t('coupon.target')}</th>
                            <th className="p-4 border-b text-center text-gray-600 font-semibold">{t('coupon.status')}</th>
                            <th className="p-4 border-b text-center text-gray-600 font-semibold">{t('coupon.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {loading && coupons.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">{t('common.loading')}</td></tr>
                        ) : coupons.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500 italic">{t('common.no_data')}</td></tr>
                        ) : coupons.map((coupon) => (
                            <tr key={coupon.id} className="hover:bg-gray-50 transition">
                                <td className="p-4 font-bold text-blue-600">{coupon.code}</td>
                                <td className="p-4 text-center">
                                    {coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : `${parseInt(coupon.discount_value).toLocaleString()}đ`}
                                </td >
                                <td className="p-4 text-xs font-medium text-gray-700 text-center">
                                    {new Date(coupon.start_date).toLocaleDateString('vi-VN')} - {new Date(coupon.end_date).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="p-4 text-xs text-gray-600 text-center">
                                    {getTargetLabel(coupon.target_type)}
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {coupon.is_active ? t('coupon.active') : t('coupon.inactive')}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => setSelectedCoupon(coupon)} className="bg-gray-50 text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors" title={t('menu.view')}>
                                            {t('menu.view')}
                                        </button>
                                        <button onClick={() => navigate(`/admin/coupons/edit/${coupon.id}`)} className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors" title={t('menu.edit')}>
                                            {t('menu.edit')}
                                        </button>
                                        <button onClick={() => handleDelete(coupon.id)} className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors" title={t('menu.delete')}>
                                            {t('menu.delete')}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50/50">
                    <div className="text-sm text-gray-500 font-medium order-2 md:order-1">
                        {t('common.page_of', { current: currentPage, total: totalPages })}
                        <span className="ml-2">({t('common.total')}: {totalItems})</span>
                    </div>
                    <div className="flex items-center gap-2 order-1 md:order-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-lg border transition-all ${currentPage === 1 ? 'bg-gray-50 text-gray-300 border-gray-100' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-500 hover:text-emerald-500 active:scale-95'}`}
                        >
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>

                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, idx) => {
                                const pageNum = idx + 1;
                                if (totalPages > 7 && pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                                    if (Math.abs(pageNum - currentPage) === 2) return <span key={pageNum} className="px-1 text-gray-400">...</span>;
                                    return null;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`w-8 h-8 rounded-lg font-bold transition-all text-sm flex items-center justify-center ${currentPage === pageNum ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 border border-transparent hover:border-emerald-100'}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`p-2 rounded-lg border transition-all ${currentPage === totalPages ? 'bg-gray-50 text-gray-300 border-gray-100' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-500 hover:text-emerald-500 active:scale-95'}`}
                        >
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL XEM CHI TIẾT */}
            {selectedCoupon && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-fade-in-up">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">{t('coupon.detail_title')}</h3>
                            <button onClick={() => setSelectedCoupon(null)} className="text-gray-400 hover:text-gray-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-sm">{t('coupon.code')}:</span>
                                <span className="text-xl font-bold text-blue-600 tracking-wider bg-blue-50 px-3 py-1 rounded">{selectedCoupon.code}</span>
                            </div>

                            {/* 🟢 PHẦN MỚI THÊM VÀO VIEW */}
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-blue-800 font-bold">{t('coupon.target')}</p>
                                    <p className="text-gray-700">{getTargetLabel(selectedCoupon.target_type)}</p>
                                </div>
                                <div>
                                    <p className="text-blue-800 font-bold">{t('coupon.limit_per_user')}</p>
                                    <p className="text-gray-700">
                                        {selectedCoupon.target_type === 'guest'
                                            ? `${t('coupon.unlimited')} (Guest)`
                                            : selectedCoupon.limit_per_user
                                                ? `${selectedCoupon.limit_per_user} ${t('coupon.times_per_user')}`
                                                : t('coupon.unlimited')}
                                    </p>
                                </div>
                            </div>
                            {/* --------------------------- */}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">{t('coupon.program_name')}</p>
                                    <p className="font-medium text-gray-800">{selectedCoupon.title}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">{t('coupon.discount_value')}</p>
                                    <p className="font-bold text-emerald-600">
                                        {selectedCoupon.discount_type === 'percent' ? `${selectedCoupon.discount_value}%` : `${parseInt(selectedCoupon.discount_value).toLocaleString()}đ`}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">{t('coupon.min_order')}</p>
                                    <p className="font-medium">{parseInt(selectedCoupon.min_order_value).toLocaleString()}đ</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">{t('coupon.max_discount')}</p>
                                    <p className="font-medium">{selectedCoupon.max_discount_value ? `${parseInt(selectedCoupon.max_discount_value).toLocaleString()}đ` : t('coupon.unlimited')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">{t('coupon.start_date')}</p>
                                    <p className="font-medium">{new Date(selectedCoupon.start_date).toLocaleString('vi-VN')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">{t('coupon.end_date')}</p>
                                    <p className="font-medium">{new Date(selectedCoupon.end_date).toLocaleString('vi-VN')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">{t('coupon.usage')}</p>
                                    <p className="font-medium">{selectedCoupon.used_count} / {selectedCoupon.usage_limit || '∞'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">{t('coupon.status')}</p>
                                    <p className={`font-bold ${selectedCoupon.is_active ? 'text-green-600' : 'text-red-500'}`}>
                                        {selectedCoupon.is_active ? t('coupon.active') : t('coupon.inactive')}
                                    </p>
                                </div>
                            </div>
                            {selectedCoupon.description && (
                                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 italic">
                                    "{selectedCoupon.description}"
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end">
                            <button onClick={() => setSelectedCoupon(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition">
                                {t('coupon.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}