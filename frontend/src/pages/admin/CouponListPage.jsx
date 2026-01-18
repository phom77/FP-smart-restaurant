import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function CouponListPage() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCoupon, setSelectedCoupon] = useState(null); 
    const navigate = useNavigate();

    const fetchCoupons = async () => {
        try {
            const res = await api.get('/api/coupons/admin/all'); // Admin endpoint - lấy tất cả voucher
            if (res.data.success) setCoupons(res.data.data);
        } catch (err) {
            toast.error('Không thể tải danh sách');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCoupons(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa mã này? Hành động này không thể hoàn tác!')) return;
        try {
            const res = await api.delete(`/api/coupons/${id}`);
            if (res.data.success) {
                toast.success('Đã xóa voucher');
                fetchCoupons(); 
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể xóa mã này');
        }
    };

    // Helper để hiển thị tên đối tượng cho đẹp
    const getTargetLabel = (type) => {
        switch(type) {
            case 'new_user': return 'Khách hàng mới';
            case 'guest': return 'Khách vãng lai';
            case 'customer': return 'Thành viên';
            default: return 'Tất cả mọi người';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Quản lý Voucher</h2>
                    <p className="text-sm text-gray-500">Danh sách các chương trình khuyến mãi</p>
                </div>
                <button
                    onClick={() => navigate('/admin/coupons/create')}
                    className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm"
                >
                    <span className="material-symbols-outlined text-sm">add</span> Tạo mã mới
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Mã Code</th>
                            <th className="px-6 py-4">Giảm giá</th>
                            <th className="px-6 py-4">Thời gian</th>
                            <th className="px-6 py-4">Đối tượng</th> {/* Thêm cột này nếu muốn */}
                            <th className="px-6 py-4">Trạng thái</th>
                            <th className="px-6 py-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {loading ? (
                            <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
                        ) : coupons.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500 italic">Trống.</td></tr>
                        ) : coupons.map((coupon) => (
                            <tr key={coupon.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 font-bold text-blue-600">{coupon.code}</td>
                                <td className="px-6 py-4">
                                    {coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : `${parseInt(coupon.discount_value).toLocaleString()}đ`}
                                </td>
                                <td className="px-6 py-4 text-xs">
                                    {new Date(coupon.end_date).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-600">
                                    {getTargetLabel(coupon.target_type)}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {coupon.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => setSelectedCoupon(coupon)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Xem chi tiết">
                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                        </button>
                                        <button onClick={() => navigate(`/admin/coupons/edit/${coupon.id}`)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Chỉnh sửa">
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                        <button onClick={() => handleDelete(coupon.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Xóa">
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL XEM CHI TIẾT */}
            {selectedCoupon && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-fade-in-up">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">Chi Tiết Voucher</h3>
                            <button onClick={() => setSelectedCoupon(null)} className="text-gray-400 hover:text-gray-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-sm">Mã Code:</span>
                                <span className="text-xl font-bold text-blue-600 tracking-wider bg-blue-50 px-3 py-1 rounded">{selectedCoupon.code}</span>
                            </div>
                            
                            {/* 🟢 PHẦN MỚI THÊM VÀO VIEW */}
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-blue-800 font-bold">Đối tượng áp dụng</p>
                                    <p className="text-gray-700">{getTargetLabel(selectedCoupon.target_type)}</p>
                                </div>
                                <div>
                                    <p className="text-blue-800 font-bold">Giới hạn mỗi người</p>
                                    <p className="text-gray-700">
                                        {selectedCoupon.target_type === 'guest' 
                                            ? 'Không giới hạn (Guest)' 
                                            : selectedCoupon.limit_per_user 
                                                ? `${selectedCoupon.limit_per_user} lần/người` 
                                                : 'Không giới hạn'}
                                    </p>
                                </div>
                            </div>
                            {/* --------------------------- */}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">Tên chương trình</p>
                                    <p className="font-medium text-gray-800">{selectedCoupon.title}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Giá trị giảm</p>
                                    <p className="font-bold text-emerald-600">
                                        {selectedCoupon.discount_type === 'percent' ? `${selectedCoupon.discount_value}%` : `${parseInt(selectedCoupon.discount_value).toLocaleString()}đ`}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Đơn tối thiểu</p>
                                    <p className="font-medium">{parseInt(selectedCoupon.min_order_value).toLocaleString()}đ</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Giảm tối đa</p>
                                    <p className="font-medium">{selectedCoupon.max_discount_value ? `${parseInt(selectedCoupon.max_discount_value).toLocaleString()}đ` : 'Không giới hạn'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Ngày bắt đầu</p>
                                    <p className="font-medium">{new Date(selectedCoupon.start_date).toLocaleString('vi-VN')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Ngày kết thúc</p>
                                    <p className="font-medium">{new Date(selectedCoupon.end_date).toLocaleString('vi-VN')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Tổng đã dùng</p>
                                    <p className="font-medium">{selectedCoupon.used_count} / {selectedCoupon.usage_limit || '∞'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Trạng thái</p>
                                    <p className={`font-bold ${selectedCoupon.is_active ? 'text-green-600' : 'text-red-500'}`}>
                                        {selectedCoupon.is_active ? 'Đang hoạt động' : 'Đã tắt'}
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
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}