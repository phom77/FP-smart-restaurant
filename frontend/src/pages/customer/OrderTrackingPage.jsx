import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../contexts/SocketContext';
import api from '../../services/api';

export default function OrderTrackingPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();
    const { t } = useTranslation();
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
            setError(t('customer.orders.error_fetch'));
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
            localStorage.removeItem('qr_table_number'); // ✅ Clear table number too
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

        const handleItemsRejected = (data) => {
            console.log("🚫 Items Rejected:", data);

            // Show notification to customer
            if (data.message) {
                alert(t('customer.tracking.items_rejected_msg', {
                    message: data.message,
                    count: data.items_count,
                    amount: data.amount_refunded?.toLocaleString('vi-VN')
                }));
            }

            // Refresh order to show updated items and total
            fetchOrder();
        };

        socket.on('order_status_update', handleOrderUpdate);
        socket.on('item_status_update', handleItemUpdate);
        socket.on('payment_status_update', handlePaymentUpdate);
        socket.on('payment_success', handlePaymentUpdate);
        socket.on('order_paid', handlePaymentUpdate);
        socket.on('additional_items_rejected', handleItemsRejected);

        return () => {
            socket.off('order_status_update', handleOrderUpdate);
            socket.off('item_status_update', handleItemUpdate);
            socket.off('payment_status_update', handlePaymentUpdate);
            socket.off('payment_success', handlePaymentUpdate);
            socket.off('order_paid', handlePaymentUpdate);
            socket.off('additional_items_rejected', handleItemsRejected);
        };
    }, [socket, order?.table_id, orderId, fetchOrder]);

    // 3. Cấu hình Timeline (3 Bước chuẩn Backend)
    const statusSteps = [
        { key: 'pending', label: t('customer.tracking.pending'), icon: '📝', color: 'blue' },
        { key: 'processing', label: t('customer.tracking.preparing'), icon: '👨‍🍳', color: 'yellow' },
        { key: 'completed', label: t('customer.tracking.completed'), icon: '🎉', color: 'green' }
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
                <div className="text-center bg-white rounded-2xl shadow-lg p-6 sm:p-8 max-w-md w-full">
                    <div className="text-3xl sm:text-4xl mb-4">😕</div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">{t('customer.orders.empty_title')}</h2>
                    <button onClick={() => navigate('/menu')} className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-lg w-full sm:w-auto">
                        {t('customer.orders.back_to_menu')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
                {/* Header */}
                <header className="mb-4 sm:mb-6 bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 sm:gap-0">
                        <div className="flex-1">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                                {t('customer.tracking.order_prefix')} #{order.id?.slice(0, 8)}
                            </h1>
                            <p className="text-sm sm:text-base text-gray-500 mt-1">
                                {t('customer.orders.table')} {order.table?.table_number || 'N/A'} • {new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
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
                                    className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all text-sm sm:text-base w-full sm:w-auto text-center"
                                >
                                    {t('customer.tracking.add_more')}
                                </button>
                            )}
                    </div>
                </header>

                {/* Status Timeline */}
                <div className="mb-4 sm:mb-6 bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
                    {isCancelled ? (
                        <div className="text-center py-4">
                            <div className="text-4xl sm:text-5xl mb-2">🚫</div>
                            <h2 className="text-lg sm:text-xl font-bold text-red-600">{t('customer.tracking.cancelled_title')}</h2>
                            <p className="text-sm sm:text-base text-gray-500 mb-4">{t('customer.tracking.contact_staff')}</p>
                            <button
                                onClick={() => {
                                    // Clear any stored order/table data
                                    localStorage.removeItem('addToOrderId');
                                    localStorage.removeItem('addToTableId');
                                    localStorage.removeItem('qr_table_id');
                                    localStorage.removeItem('qr_table_number');
                                    // Navigate back to menu
                                    navigate('/menu');
                                }}
                                className="px-4 sm:px-6 py-2 sm:py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-all inline-flex items-center gap-2 text-sm sm:text-base"
                            >
                                <span className="material-symbols-outlined text-lg sm:text-xl">restaurant_menu</span>
                                {t('customer.tracking.back_to_menu')}
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4 sm:mb-6">{t('customer.tracking.status')}</h2>
                            <div className="relative mx-2 sm:mx-4">
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
                                                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg transition-all duration-300 border-4 ${isActive
                                                        ? 'bg-emerald-500 text-white border-emerald-100'
                                                        : 'bg-white text-gray-300 border-gray-100'
                                                        } ${isCurrent ? 'scale-110 ring-2 ring-emerald-500 ring-offset-2' : ''}`}
                                                >
                                                    {step.icon}
                                                </div>
                                                <p className={`mt-2 text-[10px] sm:text-xs font-bold uppercase text-center ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
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
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
                    <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">{t('customer.tracking.items_details')}</h2>
                    <div className="divide-y divide-gray-100">
                        {order.order_items?.map((item) => {
                            const modifiersTotal = item.order_item_modifiers?.reduce((sum, mod) => sum + (parseFloat(mod.price) || 0), 0) || 0;
                            const itemTotal = (parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0);

                            return (
                                <div key={item.id} className="py-3 sm:py-4 first:pt-0 last:pb-0">
                                    <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
                                        <div className="flex-1">
                                            <div className="flex items-start gap-2">
                                                <span className="font-bold text-gray-800 text-sm sm:text-base">{item.quantity}x</span>
                                                <div className="flex-1">
                                                    <span className="font-medium text-gray-800 text-sm sm:text-base">{item.menu_item?.name || t('customer.tracking.unknown_item')}</span>
                                                    {/* Item Status Badge - Mobile inline */}
                                                    <span className={`inline-block ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.status === 'ready' ? 'bg-green-100 text-green-700' :
                                                        item.status === 'preparing' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {item.status === 'pending' ? t('customer.tracking.pending') :
                                                            item.status === 'preparing' ? t('customer.tracking.preparing') :
                                                                item.status === 'ready' ? t('customer.tracking.ready') : item.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Modifiers */}
                                            {item.order_item_modifiers?.length > 0 && (
                                                <div className="mt-1 ml-6 sm:ml-8 space-y-0.5">
                                                    {item.order_item_modifiers.map((mod, idx) => (
                                                        <p key={idx} className="text-xs sm:text-sm text-gray-500">
                                                            + {mod.modifier_name}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Notes */}
                                            {item.notes && (
                                                <p className="mt-1 ml-6 sm:ml-8 text-xs sm:text-sm text-amber-600 italic">
                                                    {t('customer.tracking.notes')}: {item.notes}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right ml-6 sm:ml-0">
                                            <p className="font-bold text-gray-800 text-sm sm:text-base">{itemTotal.toLocaleString('vi-VN')}đ</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Total & Payment Actions */}
                    <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-100">
                        {/* Tax Breakdown */}
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm sm:text-base text-gray-600">
                                <span>{t('customer.checkout.subtotal')}:</span>
                                <span className="font-semibold">{(order.subtotal || order.total_amount)?.toLocaleString('vi-VN')}đ</span>
                            </div>
                            {order.tax_amount > 0 && (
                                <div className="flex justify-between text-sm sm:text-base text-gray-600">
                                    <span>{t('customer.tracking.tax')}:</span>
                                    <span className="font-semibold">{order.tax_amount?.toLocaleString('vi-VN')}đ</span>
                                </div>
                            )}
                            {order.discount_amount > 0 && (
                                <div className="flex justify-between text-sm sm:text-base text-emerald-600">
                                    <span>{t('customer.tracking.discount')} {order.coupon_code ? `(${order.coupon_code})` : ''}:</span>
                                    <span className="font-semibold">-{order.discount_amount?.toLocaleString('vi-VN')}đ</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center text-lg sm:text-xl font-bold text-gray-900 pb-4">
                            <span>{t('customer.tracking.total')}</span>
                            <span className="text-emerald-600">{order.total_amount?.toLocaleString('vi-VN')}đ</span>
                        </div>

                        {/* --- KHU VỰC NÚT THANH TOÁN --- */}
                        <div className="mt-4">
                            {/* Trường hợp 1: Đã thanh toán xong */}
                            {order.payment_status === 'paid' || order.payment_status === 'success' ? (
                                <div className="space-y-3">
                                    <div className="w-full py-2 sm:py-3 bg-green-100 text-green-700 font-bold rounded-xl flex items-center justify-center gap-2 border border-green-200 animate-pulse text-sm sm:text-base">
                                        <span className="material-symbols-outlined text-lg sm:text-xl">check_circle</span>
                                        {t('customer.tracking.paid_success')}
                                    </div>
                                    <button
                                        onClick={() => {
                                            // Clear any stored order/table data
                                            localStorage.removeItem('addToOrderId');
                                            localStorage.removeItem('addToTableId');
                                            localStorage.removeItem('qr_table_id');
                                            localStorage.removeItem('qr_table_number');
                                            // Navigate back to menu
                                            navigate('/menu');
                                        }}
                                        className="w-full py-2 sm:py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 text-sm sm:text-base active:scale-[0.98]"
                                    >
                                        <span className="material-symbols-outlined text-lg sm:text-xl">restaurant_menu</span>
                                        {t('customer.tracking.back_to_menu')}
                                    </button>
                                </div>
                            ) :
                                /* Trường hợp 2: Đang chờ nhân viên (Tiền mặt) */
                                order.payment_status === 'waiting_payment' ? (
                                    <div className="w-full py-2 sm:py-3 bg-yellow-100 text-yellow-700 font-bold rounded-xl flex items-center justify-center gap-2 border border-yellow-200 text-sm sm:text-base">
                                        <span className="material-symbols-outlined text-lg sm:text-xl">hourglass_top</span>
                                        {t('customer.tracking.waiting_staff')}
                                    </div>
                                ) : (() => {
                                    /* Trường hợp 3: Chưa thanh toán -> Kiểm tra điều kiện hiện nút */

                                    // Kiểm tra order đã được accept chưa
                                    const isOrderAccepted = order.status === 'processing';

                                    // Kiểm tra tất cả món đã sẵn sàng chưa (chỉ status = 'ready')
                                    const allItemsReady = order.order_items?.every(item =>
                                        item.status === 'ready'
                                    );

                                    // Chỉ hiện nút khi: order đã accept VÀ tất cả món đã sẵn sàng
                                    const canPay = isOrderAccepted && allItemsReady;

                                    if (order.status === 'cancelled') {
                                        return null;
                                    }

                                    if (!canPay) {
                                        return (
                                            <div className="w-full py-2 sm:py-3 bg-gray-100 text-gray-500 font-bold rounded-xl flex items-center justify-center gap-2 border border-gray-200 text-sm sm:text-base">
                                                <span className="material-symbols-outlined text-lg sm:text-xl">schedule</span>
                                                {!isOrderAccepted ? t('customer.tracking.pending') : t('customer.tracking.preparing')}
                                            </div>
                                        );
                                    }

                                    return (
                                        <button
                                            onClick={() => navigate('/checkout', { state: { order } })}
                                            className="w-full py-2 sm:py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 text-sm sm:text-base active:scale-[0.98]"
                                        >
                                            <span className="material-symbols-outlined text-lg sm:text-xl">credit_card</span>
                                            {t('customer.tracking.pay_now')}
                                        </button>
                                    );
                                })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
