import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function MyOrdersPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/orders/my-orders');
            if (response.data.success) {
                setOrders(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError(t('customer.orders.error_fetch'));
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { label: t('customer.tracking.pending'), color: 'bg-yellow-100 text-yellow-700' },
            processing: { label: t('customer.tracking.preparing'), color: 'bg-blue-100 text-blue-700' },
            completed: { label: t('customer.tracking.completed') || 'Hoàn thành', color: 'bg-green-100 text-green-700' },
            cancelled: { label: t('customer.tracking.cancelled_title') || 'Đã hủy', color: 'bg-red-100 text-red-700' }
        };
        const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
                {/* Header */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6 bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
                    <div className="flex-1">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                            {t('customer.orders.title')}
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">
                            {user?.full_name || t('customer.cart.guest', { defaultValue: 'Guest' })} • {orders.length} {t('customer.orders.count')}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/menu')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-200 transition-all text-sm sm:text-base active:scale-95"
                    >
                        <span>←</span>
                        <span>{t('customer.orders.back_to_menu')}</span>
                    </button>
                </header>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base">
                        {error}
                    </div>
                )}

                {/* Orders List */}
                {orders.length === 0 ? (
                    <div className="text-center bg-white rounded-xl sm:rounded-2xl shadow-lg p-8 sm:p-12">
                        <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">📋</div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">{t('customer.orders.empty_title')}</h2>
                        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{t('customer.orders.empty_desc')}</p>
                        <button
                            onClick={() => navigate('/menu')}
                            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg sm:rounded-xl font-semibold hover:from-emerald-600 hover:to-green-600 transition-all shadow-md hover:shadow-lg text-sm sm:text-base active:scale-95"
                        >
                            {t('customer.orders.view_menu')}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3 sm:space-y-4">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                onClick={() => navigate(`/orders/${order.id}`)}
                                className="bg-white rounded-xl sm:rounded-2xl shadow-md p-4 sm:p-6 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-emerald-500 active:scale-[0.99]"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-gray-800">
                                            {t('customer.orders.order_prefix')} #{order.id.slice(0, 8)}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-gray-500">
                                            {formatDate(order.created_at)}
                                        </p>
                                    </div>
                                    {getStatusBadge(order.status)}
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3">
                                    <div>
                                        <p className="text-xs text-gray-500">{t('customer.orders.table')}</p>
                                        <p className="font-semibold text-gray-800 text-sm sm:text-base">{order.table_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">{t('customer.orders.items_count')}</p>
                                        <p className="font-semibold text-gray-800 text-sm sm:text-base">{order.items_count} {t('customer.orders.items_count')}</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                    <span className="text-xs sm:text-sm text-gray-600">{t('customer.orders.total')}:</span>
                                    <span className="text-lg sm:text-xl font-bold text-emerald-600">
                                        {order.total_amount.toLocaleString('vi-VN')}đ
                                    </span>
                                </div>

                                <div className="mt-3 text-center">
                                    <span className="text-xs sm:text-sm text-emerald-600 font-semibold">
                                        {t('customer.orders.view_details')} →
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
