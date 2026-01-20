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

            // Immediately filter out rejected items from current state
            if (data.rejected_items && Array.isArray(data.rejected_items)) {
                const rejectedItemIds = data.rejected_items.map(item => item.id);

                setOrder(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        order_items: prev.order_items?.filter(item =>
                            !rejectedItemIds.includes(item.id)
                        ) || [],
                        total_amount: data.new_total || prev.total_amount
                    };
                });
            }

            // Show notification to customer
            if (data.message) {
                alert(t('customer.tracking.items_rejected_msg', {
                    message: data.message,
                    count: data.items_count,
                    amount: data.amount_refunded?.toLocaleString('vi-VN')
                }));
            }

            // Refresh order to ensure data consistency
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
            <div className="max-w-3xl mx-auto px-4 py-6">
                {/* Header */}
                <header className="mb-6 bg-white rounded-3xl shadow-sm p-6 border border-gray-100 flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold uppercase tracking-wider border border-emerald-100">
                                {t('customer.tracking.order_prefix')}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800">#{order.id?.slice(0, 8)}</h1>
                        <p className="text-gray-500 mt-1 font-medium flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">table_restaurant</span>
                            {t('customer.orders.table')} {order.table?.table_number || 'N/A'}
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            {new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>

                    {/* Only show "Add More Items" button if order is not completed and not paid */}
                    {order.status !== 'completed' &&
                        order.status !== 'cancelled' &&
                        order.payment_status !== 'paid' &&
                        order.payment_status !== 'success' && (
                            <button
                                onClick={() => {
                                    localStorage.setItem('addToOrderId', order.id);
                                    localStorage.setItem('addToTableId', order.table_id);
                                    navigate('/menu');
                                }}
                                className="px-5 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 active:scale-95 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-xl">add_shopping_cart</span>
                                {t('customer.tracking.add_more')}
                            </button>
                        )}
                </header>

                {/* Status Timeline */}
                <div className="mb-6 bg-white rounded-3xl shadow-sm p-6 sm:p-8 border border-gray-100">
                    {isCancelled ? (
                        <div className="text-center py-6">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-4xl text-red-500">cancel</span>
                            </div>
                            <h2 className="text-xl font-bold text-red-600 mb-2">{t('customer.tracking.cancelled_title')}</h2>
                            <p className="text-gray-500 mb-6 max-w-xs mx-auto">{t('customer.tracking.contact_staff')}</p>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('addToOrderId');
                                    localStorage.removeItem('addToTableId');
                                    localStorage.removeItem('qr_table_id');
                                    localStorage.removeItem('qr_table_number');
                                    navigate('/menu');
                                }}
                                className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-all inline-flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">restaurant_menu</span>
                                {t('customer.tracking.back_to_menu')}
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-lg font-bold text-gray-800 mb-8 flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-600">timeline</span>
                                {t('customer.tracking.status')}
                            </h2>
                            <div className="relative px-4">
                                {/* Progress Line */}
                                <div className="absolute top-5 left-8 right-8 h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 transition-all duration-700 ease-out"
                                        style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
                                    ></div>
                                </div>

                                {/* Steps */}
                                <div className="relative flex justify-between z-10">
                                    {statusSteps.map((step, index) => {
                                        const isActive = index <= currentStatusIndex;
                                        const isCurrent = index === currentStatusIndex;

                                        return (
                                            <div key={step.key} className="flex flex-col items-center">
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 border-4 ${isActive
                                                        ? 'bg-emerald-500 text-white border-emerald-100 shadow-lg shadow-emerald-200'
                                                        : 'bg-white text-gray-300 border-gray-100'
                                                        } ${isCurrent ? 'scale-125 ring-4 ring-emerald-50' : ''}`}
                                                >
                                                    {step.icon}
                                                </div>
                                                <p className={`mt-3 text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isActive ? 'text-emerald-700' : 'text-gray-400'}`}>
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
                <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-600">receipt_long</span>
                        {t('customer.tracking.items_details')}
                    </h2>
                    <div className="space-y-6">
                        {order.order_items?.map((item) => {
                            const itemTotal = (parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0);

                            return (
                                <div key={item.id} className="flex flex-col sm:flex-row gap-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 font-bold text-gray-700 text-sm">
                                                {item.quantity}x
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-gray-800 text-lg">{item.menu_item?.name || t('customer.tracking.unknown_item')}</h3>
                                                    <p className="font-bold text-emerald-600 ml-4">{itemTotal.toLocaleString('vi-VN')}đ</p>
                                                </div>

                                                {/* Item Status Badge */}
                                                <div className="mt-2">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${item.status === 'ready' ? 'bg-green-50 text-green-700 border border-green-100' :
                                                        item.status === 'preparing' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                                                            'bg-gray-100 text-gray-500 border border-gray-200'
                                                        }`}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                        {item.status === 'pending' ? t('customer.tracking.pending') :
                                                            item.status === 'preparing' ? t('customer.tracking.preparing') :
                                                                item.status === 'ready' ? t('customer.tracking.ready') : item.status}
                                                    </span>
                                                </div>



                                                {/* Notes */}
                                                {item.notes && (
                                                    <div className="mt-2 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 inline-block">
                                                        <p className="text-xs text-amber-800 font-medium flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-sm">edit_note</span>
                                                            {item.notes}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Total & Payment Actions */}
                    <div className="mt-8 pt-6 border-t border-gray-100 bg-gray-50/50 rounded-2xl p-6 -mx-2 sm:-mx-4">
                        {/* Tax Breakdown */}
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-gray-600">
                                <span>{t('customer.checkout.subtotal')}</span>
                                <span className="font-medium">{(order.subtotal || order.total_amount)?.toLocaleString('vi-VN')}đ</span>
                            </div>
                            {order.tax_amount > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>{t('customer.tracking.tax')}</span>
                                    <span className="font-medium">+{order.tax_amount?.toLocaleString('vi-VN')}đ</span>
                                </div>
                            )}
                            {order.discount_amount > 0 && (
                                <div className="flex justify-between text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">sell</span>
                                        {t('customer.tracking.discount')} {order.coupon_code ? `(${order.coupon_code})` : ''}
                                    </span>
                                    <span className="font-bold">-{order.discount_amount?.toLocaleString('vi-VN')}đ</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center pb-6 border-b border-gray-200 mb-6">
                            <span className="text-xl font-bold text-gray-800">{t('customer.tracking.total')}</span>
                            <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                                {order.total_amount?.toLocaleString('vi-VN')}đ
                            </span>
                        </div>

                        {/* --- KHU VỰC NÚT THANH TOÁN --- */}
                        <div>
                            {/* Trường hợp 1: Đã thanh toán xong */}
                            {order.payment_status === 'paid' || order.payment_status === 'success' ? (
                                <div className="space-y-4">
                                    <div className="w-full py-4 bg-green-50 text-green-700 font-bold rounded-2xl flex items-center justify-center gap-2 border border-green-200 shadow-sm">
                                        <span className="material-symbols-outlined text-2xl">check_circle</span>
                                        {t('customer.tracking.paid_success')}
                                    </div>
                                    <button
                                        onClick={() => {
                                            localStorage.removeItem('addToOrderId');
                                            localStorage.removeItem('addToTableId');
                                            localStorage.removeItem('qr_table_id');
                                            localStorage.removeItem('qr_table_number');
                                            navigate('/menu');
                                        }}
                                        className="w-full py-4 bg-white text-emerald-600 border-2 border-emerald-100 font-bold rounded-2xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">restaurant_menu</span>
                                        {t('customer.tracking.back_to_menu')}
                                    </button>
                                </div>
                            ) :
                                /* Trường hợp 2: Đang chờ nhân viên (Tiền mặt) */
                                order.payment_status === 'waiting_payment' ? (
                                    <div className="w-full py-4 bg-amber-50 text-amber-700 font-bold rounded-2xl flex items-center justify-center gap-2 border border-amber-200 animate-pulse">
                                        <span className="material-symbols-outlined text-2xl">hourglass_top</span>
                                        {t('customer.tracking.waiting_staff')}
                                    </div>
                                ) : (() => {
                                    /* Trường hợp 3: Chưa thanh toán -> Kiểm tra điều kiện hiện nút */

                                    const isOrderAccepted = order.status === 'processing';
                                    const allItemsReady = order.order_items?.every(item =>
                                        item.status === 'ready'
                                    );
                                    const canPay = isOrderAccepted && allItemsReady;

                                    if (order.status === 'cancelled') {
                                        return null;
                                    }

                                    if (!canPay) {
                                        return (
                                            <div className="w-full py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl flex items-center justify-center gap-2 border border-gray-200">
                                                <span className="material-symbols-outlined">schedule</span>
                                                <span className="text-center">
                                                    {!isOrderAccepted
                                                        ? t('customer.tracking.pending')
                                                        : t('customer.tracking.preparing')
                                                    }
                                                </span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <button
                                            onClick={() => navigate('/checkout', { state: { order } })}
                                            className="w-full py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                        >
                                            <span className="material-symbols-outlined">credit_card</span>
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
