import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function MyOrdersPage() {
    const navigate = useNavigate();
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
            setError('Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700' },
            processing: { label: 'Đang phục vụ', color: 'bg-blue-100 text-blue-700' },
            completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
            cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' }
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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <header className="flex justify-between items-center mb-6 bg-white rounded-2xl shadow-lg p-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                            Đơn hàng của tôi
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {user?.full_name || 'Khách hàng'} • {orders.length} đơn
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/menu')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                    >
                        <span>←</span>
                        <span>Về thực đơn</span>
                    </button>
                </header>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
                        {error}
                    </div>
                )}

                {/* Orders List */}
                {orders.length === 0 ? (
                    <div className="text-center bg-white rounded-2xl shadow-lg p-12">
                        <div className="text-6xl mb-4">📋</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Chưa có đơn hàng</h2>
                        <p className="text-gray-600 mb-6">Hãy đặt món đầu tiên của bạn!</p>
                        <button
                            onClick={() => navigate('/menu')}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-green-600 transition-all shadow-md hover:shadow-lg"
                        >
                            Xem thực đơn
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                onClick={() => navigate(`/orders/${order.id}`)}
                                className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-emerald-500"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">
                                            Đơn #{order.id.slice(0, 8)}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {formatDate(order.created_at)}
                                        </p>
                                    </div>
                                    {getStatusBadge(order.status)}
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <p className="text-xs text-gray-500">Bàn</p>
                                        <p className="font-semibold text-gray-800">{order.table_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Số món</p>
                                        <p className="font-semibold text-gray-800">{order.items_count} món</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                    <span className="text-sm text-gray-600">Tổng tiền:</span>
                                    <span className="text-xl font-bold text-emerald-600">
                                        {order.total_amount.toLocaleString('vi-VN')}đ
                                    </span>
                                </div>

                                <div className="mt-3 text-center">
                                    <span className="text-sm text-emerald-600 font-semibold">
                                        Nhấn để xem chi tiết →
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
