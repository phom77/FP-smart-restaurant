import { useState, useEffect, useCallback } from 'react';
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

    const fetchOrder = useCallback(async () => {
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
    }, [orderId]); // Chỉ tạo lại khi orderId thay đổi

    // 1. Fetch ban đầu
    useEffect(() => {
        if (orderId) {
            fetchOrder();
        }
    }, [orderId, fetchOrder]); // Thêm fetchOrder vào dependency

    useEffect(() => {
        if (order?.status === 'completed' || order?.payment_status === 'paid') {
            localStorage.removeItem('addToOrderId');
            localStorage.removeItem('addToTableId');
            localStorage.removeItem('qr_table_id'); // ✅ Thêm cả dòng này
        }
    }, [order?.status, order?.payment_status]);

    // 2. Socket Logic
    useEffect(() => {
        if (!socket || !order) return;

        if (order.table_id) {
            socket.emit('join_room', `table_${order.table_id}`);
        }

        const handleOrderUpdate = (data) => {
            if (data.order_id === orderId) {
                setOrder(prev => prev ? ({ ...prev, status: data.status }) : null);
            }
        };

        const handleItemUpdate = (data) => {
            setOrder(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    order_items: prev.order_items?.map(item =>
                        item.id === data.itemId
                            ? { ...item, status: data.status }
                            : item
                    ) || []
                };
            });
        };

        const handlePaymentUpdate = (data) => {
            console.log("💰 Payment Update nhận được:", data);

            const incomingId = data.orderId || data.order_id;

            if (incomingId === orderId) {
                // ✅ Giờ fetchOrder đã stable, gọi an toàn
                fetchOrder();
            }
        };

        socket.on('order_status_update', handleOrderUpdate);
        socket.on('item_status_update', handleItemUpdate);
        socket.on('payment_status_update', handlePaymentUpdate);
        socket.on('payment_success', handlePaymentUpdate);
        socket.on('order_paid', handlePaymentUpdate);

        return () => {
            socket.off('order_status_update', handleOrderUpdate);
            socket.off('item_status_update', handleItemUpdate);
            socket.off('payment_status_update', handlePaymentUpdate);
            socket.off('payment_success', handlePaymentUpdate);
            socket.off('order_paid', handlePaymentUpdate);
        };
    }, [socket, order?.table_id, orderId, fetchOrder]);

    // 3. Cấu hình Timeline (3 Bước chuẩn Backend)
    const statusSteps = [
        { key: 'pending', label: 'Chờ xác nhận', icon: '📝', color: 'blue' },
        { key: 'processing', label: 'Đang phục vụ', icon: '👨‍🍳', color: 'yellow' },
        { key: 'completed', label: 'Hoàn thành', icon: '🎉', color: 'green' }
    ];

    // Helper map status
    const getStatusIndex = (status) => {
        switch (status) {
            case 'pending': return 0;
            case 'processing': return 1;
            case 'completed': return 2;
            case 'cancelled': return -1; // Trạng thái hủy
            default: return 0;
        }
    };

    const currentStatusIndex = order ? getStatusIndex(order.status) : 0;
    const isCancelled = order?.status === 'cancelled';

    // --- RENDER ---

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
                    <div className="text-4xl mb-4">😕</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy đơn hàng</h2>
                    <button onClick={() => navigate('/menu')} className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-lg">
                        Về thực đơn
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-3xl mx-auto px-4 py-6">
                {/* Header */}
                <header className="mb-6 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                Đơn #{order.id?.slice(0, 8)}
                            </h1>
                            <p className="text-gray-500 mt-1">
                                Bàn {order.table?.table_number || 'N/A'} • {new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        {/* Only show "Add More Items" button if order is not completed and not paid */}
                        {order.status !== 'completed' &&
                            order.status !== 'cancelled' &&
                            order.payment_status !== 'paid' &&
                            order.payment_status !== 'success' && (
                                <button
                                    onClick={() => {
                                        // Store in localStorage to persist across navigation
                                        localStorage.setItem('addToOrderId', order.id);
                                        localStorage.setItem('addToTableId', order.table_id);

                                        navigate('/menu');
                                    }}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                                >
                                    Thêm món
                                </button>
                            )}
                    </div>
                </header>

                {/* Status Timeline */}
                <div className="mb-6 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    {isCancelled ? (
                        <div className="text-center py-4">
                            <div className="text-5xl mb-2">🚫</div>
                            <h2 className="text-xl font-bold text-red-600">Đơn hàng đã bị hủy</h2>
                            <p className="text-gray-500">Vui lòng liên hệ nhân viên để được hỗ trợ.</p>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-lg font-bold text-gray-800 mb-6">Trạng thái</h2>
                            <div className="relative mx-4">
                                {/* Progress Line */}
                                <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
                                    ></div>
                                </div>

                                {/* Steps */}
                                <div className="relative flex justify-between">
                                    {statusSteps.map((step, index) => {
                                        const isActive = index <= currentStatusIndex;
                                        const isCurrent = index === currentStatusIndex;

                                        return (
                                            <div key={step.key} className="flex flex-col items-center z-10">
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300 border-4 ${isActive
                                                        ? 'bg-emerald-500 text-white border-emerald-100'
                                                        : 'bg-white text-gray-300 border-gray-100'
                                                        } ${isCurrent ? 'scale-110 ring-2 ring-emerald-500 ring-offset-2' : ''}`}
                                                >
                                                    {step.icon}
                                                </div>
                                                <p className={`mt-2 text-xs font-bold uppercase ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                    {step.label}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Chi tiết món</h2>
                    <div className="divide-y divide-gray-100">
                        {order.order_items?.map((item) => {
                            const modifiersTotal = item.order_item_modifiers?.reduce((sum, mod) => sum + (mod.price || 0), 0) || 0;
                            const itemTotal = (item.price + modifiersTotal) * item.quantity;

                            return (
                                <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                                    <div className="flex justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-800">{item.quantity}x</span>
                                                <span className="font-medium text-gray-800">{item.menu_item?.name || 'Món không xác định'}</span>
                                            </div>

                                            {/* Modifiers */}
                                            {item.order_item_modifiers?.length > 0 && (
                                                <div className="mt-1 ml-6 space-y-0.5">
                                                    {item.order_item_modifiers.map((mod, idx) => (
                                                        <p key={idx} className="text-sm text-gray-500">
                                                            + {mod.modifier_name}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Notes */}
                                            {item.notes && (
                                                <p className="mt-1 ml-6 text-sm text-amber-600 italic">
                                                    Ghi chú: {item.notes}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-800">{itemTotal.toLocaleString('vi-VN')}đ</p>
                                            {/* Item Status Badge */}
                                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.status === 'ready' ? 'bg-green-100 text-green-700' :
                                                item.status === 'preparing' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-500'
                                                }`}>
                                                {item.status === 'pending' ? 'Chờ' :
                                                    item.status === 'preparing' ? 'Đang nấu' :
                                                        item.status === 'ready' ? 'Xong' : item.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Total & Payment Actions */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                            <span>Tổng tiền</span>
                            <span className="text-emerald-600">{order.total_amount?.toLocaleString('vi-VN')}đ</span>
                        </div>

                        {/* --- KHU VỰC NÚT THANH TOÁN --- */}
                        <div className="mt-4">
                            {/* Trường hợp 1: Đã thanh toán xong */}
                            {order.payment_status === 'paid' || order.payment_status === 'success' ? (
                                <div className="w-full py-3 bg-green-100 text-green-700 font-bold rounded-xl flex items-center justify-center gap-2 border border-green-200 animate-pulse">
                                    <span className="material-symbols-outlined">check_circle</span>
                                    Đã thanh toán thành công
                                </div>
                            ) :
                                /* Trường hợp 2: Đang chờ nhân viên (Tiền mặt) */
                                order.payment_status === 'waiting_payment' ? (
                                    <div className="w-full py-3 bg-yellow-100 text-yellow-700 font-bold rounded-xl flex items-center justify-center gap-2 border border-yellow-200">
                                        <span className="material-symbols-outlined">hourglass_top</span>
                                        Đang chờ nhân viên xác nhận...
                                    </div>
                                ) : (
                                    /* Trường hợp 3: Chưa thanh toán -> Hiện nút */
                                    order.status !== 'cancelled' && (
                                        <button
                                            onClick={() => navigate('/checkout', { state: { order } })}
                                            className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined">credit_card</span>
                                            Thanh toán ngay
                                        </button>
                                    )
                                )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
