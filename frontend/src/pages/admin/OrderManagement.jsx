import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const OrderManagement = () => {
    const { t } = useTranslation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [totalOrders, setTotalOrders] = useState(0);
    const [currentTime, setCurrentTime] = useState(new Date());
    const itemsPerPage = 10;
    const fetchingRef = useRef(false);
    const debounceRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    const getAuthHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const fetchOrders = async (showLoading = true) => {
        // Prevent concurrent requests
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        
        try {
            if (showLoading) setLoading(true);
            let url = `${API_URL}/api/orders?limit=10000`; // Fetch all orders
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;
            if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

            const response = await axios.get(url, getAuthHeader());
            console.log('API Response:', response.data);
            setOrders(response.data.data || []);
            // Get total count from pagination
            const total = response.data.pagination?.total || response.data.data?.length || 0;
            console.log('Total orders:', total, 'Pagination:', response.data.pagination);
            setTotalOrders(total);
        } catch (err) {
            console.error(err);
            toast.error(t('admin.order_fetch_error'));
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    };

    useEffect(() => {
        fetchOrders(true);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [statusFilter]);

    // Debounce search to avoid excessive API calls
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        
        debounceRef.current = setTimeout(() => {
            fetchOrders(false); // Fetch silently, no loading spinner
        }, 500); // Wait 500ms after user stops typing
        
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [searchQuery]);

    // Trigger immediate search (used by search button or Enter key)
    const handleSearch = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
        fetchOrders(true);
    };

    const getElapsedTime = (createdAt) => {
        const diff = Math.floor((currentTime - new Date(createdAt)) / 60000);
        if (diff < 1) return t('admin.order_new');
        if (diff < 60) return `${diff}m`;
        return `${Math.floor(diff / 60)}h`;
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: t('admin.status_pending') },
            processing: { bg: 'bg-blue-100', text: 'text-blue-700', label: t('admin.status_processing') },
            completed: { bg: 'bg-green-100', text: 'text-green-700', label: t('admin.status_completed') },
            cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: t('admin.status_cancelled') }
        };
        return badges[status] || badges.pending;
    };

    const getPaymentStatusBadge = (status) => {
        const badges = {
            pending: { bg: 'bg-gray-100', text: 'text-gray-600', label: t('admin.payment_pending') },
            waiting_payment: { bg: 'bg-orange-100', text: 'text-orange-700', label: t('admin.payment_waiting') },
            paid: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: t('admin.payment_paid') }
        };
        return badges[status] || badges.pending;
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await axios.put(
                `${API_URL}/api/orders/${orderId}/status`,
                { status: newStatus },
                getAuthHeader()
            );
            toast.success(t('admin.order_updated'));
            fetchOrders(false);
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
        } catch (err) {
            toast.error(t('admin.order_update_error'));
        }
    };

    const filteredAndSortedOrders = useMemo(() => {
        // Orders already filtered by backend, just sort by date
        return orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [orders]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-600">receipt_long</span>
                        {t('admin.order_management')}
                    </h1>
                    <p className="text-gray-500 mt-1">{t('admin.order_count')}: {totalOrders}</p>
                </div>
                <button
                    onClick={() => fetchOrders(true)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">refresh</span>
                    {t('common.refresh')}
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        placeholder={t('admin.order_search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">search</span>
                    </button>
                </form>

                {/* Status Filter */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-4 py-2 rounded-xl font-bold transition-all ${
                            statusFilter === 'all'
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {t('admin.filter_all')} ({orders.length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('pending')}
                        className={`px-4 py-2 rounded-xl font-bold transition-all ${
                            statusFilter === 'pending'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                        }`}
                    >
                        {t('admin.status_pending')} ({orders.filter(o => o.status === 'pending').length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('processing')}
                        className={`px-4 py-2 rounded-xl font-bold transition-all ${
                            statusFilter === 'processing'
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                    >
                        {t('admin.status_processing')} ({orders.filter(o => o.status === 'processing').length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('completed')}
                        className={`px-4 py-2 rounded-xl font-bold transition-all ${
                            statusFilter === 'completed'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                    >
                        {t('admin.status_completed')} ({orders.filter(o => o.status === 'completed').length})
                    </button>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">{t('admin.order_id')}</th>
                                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">{t('admin.order_table')}</th>
                                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">{t('admin.order_customer')}</th>
                                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">{t('admin.order_time')}</th>
                                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">{t('admin.order_status')}</th>
                                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">{t('admin.order_payment')}</th>
                                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">{t('admin.order_total')}</th>
                                <th className="px-6 py-3 text-center text-sm font-bold text-gray-700">{t('common.action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredAndSortedOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-gray-400">
                                        {t('admin.order_empty')}
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedOrders.map(order => {
                                    const badge = getStatusBadge(order.status);
                                    const paymentBadge = getPaymentStatusBadge(order.payment_status);

                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm font-bold text-gray-800">
                                                    #{order.id.slice(0, 8)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-700 font-semibold">
                                                {order.tables?.table_number ? `Bàn ${order.tables.table_number}` : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {order.users?.full_name || t('admin.order_guest')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600">
                                                    {new Date(order.created_at).toLocaleTimeString('vi-VN')}
                                                </div>
                                                <div className="text-xs text-gray-400">{getElapsedTime(order.created_at)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${paymentBadge.bg} ${paymentBadge.text}`}>
                                                    {paymentBadge.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-emerald-600">
                                                    {order.total_amount?.toLocaleString('vi-VN')}đ
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setIsDetailModalOpen(true);
                                                    }}
                                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-all"
                                                >
                                                    {t('common.view')}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {isDetailModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800">
                                {t('admin.order_details')} #{selectedOrder.id.slice(0, 8)}
                            </h2>
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Order Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('admin.order_table')}</p>
                                    <p className="text-lg font-bold text-gray-800">{selectedOrder.tables?.table_number}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('admin.order_customer')}</p>
                                    <p className="text-lg font-bold text-gray-800">{selectedOrder.users?.full_name || t('admin.order_guest')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('admin.order_created')}</p>
                                    <p className="text-lg font-bold text-gray-800">
                                        {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('admin.order_total')}</p>
                                    <p className="text-lg font-bold text-emerald-600">
                                        {selectedOrder.total_amount?.toLocaleString('vi-VN')}đ
                                    </p>
                                </div>
                            </div>

                            {/* Status Update */}
                            <div className="border-t border-gray-100 pt-6">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-3">{t('admin.order_status')}</p>
                                <div className="flex gap-2 flex-wrap">
                                    {['pending', 'processing', 'completed', 'cancelled'].map(status => {
                                        const badge = getStatusBadge(status);
                                        const isCurrentStatus = selectedOrder.status === status;
                                        return (
                                            <button
                                                key={status}
                                                onClick={() => handleUpdateStatus(selectedOrder.id, status)}
                                                className={`px-4 py-2 rounded-xl font-bold transition-all ${
                                                    isCurrentStatus
                                                        ? `${badge.bg} ${badge.text} ring-2`
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                {getStatusBadge(status).label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Items */}
                            <div className="border-t border-gray-100 pt-6">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-3">{t('admin.order_items')}</p>
                                <div className="space-y-3">
                                    {selectedOrder.order_items?.map(item => (
                                        <div key={item.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-bold text-gray-800">
                                                    {item.quantity}x {item.menu_items?.name}
                                                </div>
                                                <span className="text-emerald-600 font-bold">
                                                    {(item.unit_price * item.quantity).toLocaleString('vi-VN')}đ
                                                </span>
                                            </div>
                                            {item.notes && (
                                                <p className="text-xs text-gray-500 italic">
                                                    📝 {item.notes}
                                                </p>
                                            )}
                                            {item.order_item_modifiers?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {item.order_item_modifiers.map(m => (
                                                        <span key={m.id} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                            + {m.modifier_name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div className="border-t border-gray-100 pt-6">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-3">{t('admin.order_payment')}</p>
                                <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">{t('admin.order_subtotal')}</span>
                                        <span className="font-bold">{(selectedOrder.subtotal || selectedOrder.total_amount).toLocaleString('vi-VN')}đ</span>
                                    </div>
                                    {selectedOrder.tax_amount > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">{t('admin.order_tax')}</span>
                                            <span className="font-bold">{selectedOrder.tax_amount.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                    )}
                                    {selectedOrder.discount_amount > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">{t('admin.order_discount')}</span>
                                            <span className="font-bold text-emerald-600">-{selectedOrder.discount_amount.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                    )}
                                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                                        <span className="font-bold">{t('admin.order_total')}</span>
                                        <span className="text-lg font-bold text-emerald-600">{selectedOrder.total_amount?.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManagement;
