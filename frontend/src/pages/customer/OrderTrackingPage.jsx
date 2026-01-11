import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import api from '../../services/api';

export default function OrderTrackingPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch order details
    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await api.get(`/api/orders/${orderId}`);
                if (response.data.success) {
                    setOrder(response.data.data);
                }
            } catch (err) {
                console.error('Error fetching order:', err);
                setError('Không thể tải thông tin đơn hàng');
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);

    // Listen for real-time order updates
    useEffect(() => {
        if (!socket || !orderId) return;

        const handleOrderUpdate = (data) => {
            if (data.order_id === orderId) {
                setOrder(prev => ({
                    ...prev,
                    status: data.status
                }));
            }
        };

        const handleItemUpdate = (data) => {
            if (data.order_id === orderId) {
                setOrder(prev => ({
                    ...prev,
                    order_items: prev.order_items.map(item =>
                        item.id === data.item_id
                            ? { ...item, status: data.status }
                            : item
                    )
                }));
            }
        };

        socket.on('order_status_update', handleOrderUpdate);
        socket.on('item_status_update', handleItemUpdate);

        return () => {
            socket.off('order_status_update', handleOrderUpdate);
            socket.off('item_status_update', handleItemUpdate);
        };
    }, [socket, orderId]);

    // Status timeline configuration
    const statusSteps = [
        { key: 'pending', label: 'Đã nhận', icon: '📝', color: 'blue' },
        { key: 'preparing', label: 'Đang chuẩn bị', icon: '👨‍🍳', color: 'yellow' },
        { key: 'ready', label: 'Sẵn sàng', icon: '✅', color: 'green' },
        { key: 'completed', label: 'Hoàn thành', icon: '🎉', color: 'purple' }
    ];

    const getStatusIndex = (status) => {
        return statusSteps.findIndex(step => step.key === status);
    };

    const currentStatusIndex = order ? getStatusIndex(order.status) : 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
                    <p className="mt-4 text-lg text-gray-600 font-medium">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
                <div className="text-center bg-white rounded-2xl shadow-lg p-12 max-w-md w-full">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Lỗi</h2>
                    <p className="text-gray-600 mb-6">{error || 'Không tìm thấy đơn hàng'}</p>
                    <button
                        onClick={() => navigate('/menu')}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-green-600 transition-all shadow-md hover:shadow-lg"
                    >
                        Về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <header className="mb-6 bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                                Đơn hàng #{order.id.slice(0, 8)}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Bàn {order.table?.table_number} • {new Date(order.created_at).toLocaleString('vi-VN')}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/menu')}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                        >
                            Về menu
                        </button>
                    </div>
                </header>

                {/* Status Timeline */}
                <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Trạng thái đơn hàng</h2>
                    <div className="relative">
                        {/* Progress Line */}
                        <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500"
                                style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
                            ></div>
                        </div>

                        {/* Status Steps */}
                        <div className="relative flex justify-between">
                            {statusSteps.map((step, index) => {
                                const isActive = index <= currentStatusIndex;
                                const isCurrent = index === currentStatusIndex;

                                return (
                                    <div key={step.key} className="flex flex-col items-center">
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${isActive
                                                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 scale-110 shadow-lg'
                                                    : 'bg-gray-200'
                                                } ${isCurrent ? 'animate-pulse' : ''}`}
                                        >
                                            {step.icon}
                                        </div>
                                        <p className={`mt-2 text-sm font-semibold ${isActive ? 'text-emerald-600' : 'text-gray-500'}`}>
                                            {step.label}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Chi tiết đơn hàng</h2>
                    <div className="space-y-4">
                        {order.order_items?.map((item) => {
                            const modifiersTotal = item.order_item_modifiers?.reduce(
                                (sum, mod) => sum + (mod.price || 0),
                                0
                            ) || 0;
                            const itemTotal = (item.price + modifiersTotal) * item.quantity;

                            return (
                                <div key={item.id} className="border-b border-gray-200 pb-4 last:border-0">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800">{item.menu_item?.name}</h3>
                                            <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>

                                            {/* Modifiers */}
                                            {item.order_item_modifiers && item.order_item_modifiers.length > 0 && (
                                                <div className="mt-1">
                                                    {item.order_item_modifiers.map((mod, idx) => (
                                                        <p key={idx} className="text-sm text-gray-600">
                                                            • {mod.modifier_name} (+{mod.price.toLocaleString('vi-VN')}đ)
                                                        </p>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Item Status */}
                                            <div className="mt-2">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                                                        item.status === 'preparing' ? 'bg-yellow-100 text-yellow-700' :
                                                            item.status === 'ready' ? 'bg-green-100 text-green-700' :
                                                                'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {item.status === 'pending' ? '⏳ Chờ xử lý' :
                                                        item.status === 'preparing' ? '👨‍🍳 Đang nấu' :
                                                            item.status === 'ready' ? '✅ Sẵn sàng' :
                                                                item.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="font-bold text-gray-800">
                                                {itemTotal.toLocaleString('vi-VN')}đ
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Order Summary */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Tổng cộng</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between text-gray-700">
                            <span>Tạm tính:</span>
                            <span className="font-semibold">{order.total_amount?.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                            <span>Thuế VAT (10%):</span>
                            <span className="font-semibold">{(order.total_amount * 0.1).toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="border-t-2 border-gray-200 pt-2 mt-2">
                            <div className="flex justify-between text-xl font-bold text-gray-900">
                                <span>Tổng cộng:</span>
                                <span className="text-emerald-600">
                                    {(order.total_amount * 1.1).toLocaleString('vi-VN')}đ
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Status */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700">Trạng thái thanh toán:</span>
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${order.payment_status === 'paid'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                {order.payment_status === 'paid' ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
