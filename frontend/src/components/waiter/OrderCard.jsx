import React from 'react';
import { useTranslation } from 'react-i18next';

const OrderCard = ({ order, onAccept, onReject, onComplete, onServed, onConfirmPayment, onRejectAdditionalItems, onViewDetails }) => {
    const { t } = useTranslation();

    // Format currency an toàn
    const formatPrice = (price) => {
        return parseInt(price || 0).toLocaleString() + 'đ';
    };

    // Parse date an toàn
    const formatDate = (dateString) => {
        if (!dateString) return t('waiter.just_now');
        try {
            return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return t('waiter.invalid_date');
        }
    };

    if (!order) return null;

    // Kiểm tra trạng thái thanh toán
    const isPaid = order.payment_status === 'paid';
    const isWaitingPayment = order.payment_status === 'waiting_payment';
    const isServed = order.is_served;

    return (
        <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full relative group ${isWaitingPayment ? 'border-orange-400 ring-2 ring-orange-100' : 'border-gray-100'}`}>
            {/* Header */}
            <div
                onClick={onViewDetails}
                className={`p-4 flex justify-between items-center border-b cursor-pointer transition-colors ${isPaid ? 'bg-green-50 border-green-100' :
                    isWaitingPayment ? 'bg-orange-50 border-orange-100' : // Màu cam cho chờ thanh toán
                        'bg-gradient-to-r from-blue-50 to-white border-blue-50'
                    }`}
            >
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-8 rounded-full transition-all ${order.status === 'pending' ? 'bg-yellow-500' :
                        isPaid ? 'bg-green-500' : 'bg-blue-500'
                        }`}></div>
                    <span className="font-extrabold text-lg text-gray-800">
                        {t('waiter.table')} {order.table?.table_number || 'N/A'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {isServed && !isPaid && <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">{t('waiter.served_badge')}</span>}
                    {isPaid && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">{t('waiter.paid_badge')}</span>}
                    {isWaitingPayment && <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded animate-pulse">{t('waiter.bill_request')}</span>}

                    <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 font-bold">
                        #{order.id?.slice(0, 6)}
                    </span>
                </div>
            </div>

            {/* Body: Items & Progress */}
            <div className="p-5 flex-1">
                {/* Thanh tiến độ bếp */}
                {order.status === 'processing' && (
                    <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">{t('waiter.kitchen_progress')}</span>
                            <span className="font-bold text-blue-600">
                                {order.items?.filter(i => i.status === 'ready' || i.status === 'served').length} / {order.items?.length}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(order.items?.filter(i => i.status === 'ready' || i.status === 'served').length / order.items?.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                <ul className="space-y-3">
                    {order.items?.map((item, index) => (
                        <li key={item.id || index} className="flex justify-between items-start text-sm">
                            <div className="flex-1 pr-2">
                                <span className="font-bold text-gray-800 mr-2">{item.quantity}x</span>
                                <span className="text-gray-700 font-medium">{item.menu_item?.name || 'Unknown'}</span>

                                {/* Hiển thị trạng thái từng món nhỏ */}
                                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-tighter ${item.status === 'pending' ? 'bg-red-100 text-red-600 border-red-200 animate-pulse' :
                                    item.status === 'ready' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        item.status === 'preparing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            item.status === 'served' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                'bg-gray-50 text-gray-500 border-gray-100'
                                    }`}>
                                    {item.status === 'pending' ? 'MỚI' : t(`waiter.status.${item.status}`)}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Footer: Actions */}
            <div className="p-5 pt-0 mt-auto">
                <div className="flex justify-between items-end mb-4 border-t border-dashed border-gray-100 pt-4">
                    <span className="text-gray-500 font-medium text-xs uppercase tracking-wider">{t('waiter.total')}</span>
                    <span className="text-2xl font-extrabold text-emerald-600 leading-none">
                        {formatPrice(order.total_amount)}
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {order.status === 'pending' && (
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); onAccept(order.id); }}
                                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span>{t('waiter.accept')}</span>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onReject(order.id); }}
                                className="bg-white hover:bg-rose-50 text-rose-500 py-3 rounded-xl font-bold text-sm border border-rose-100 hover:border-rose-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span>{t('waiter.reject')}</span>
                            </button>
                        </div>
                    )}

                    {order.status === 'processing' && (
                        <div className="flex flex-col gap-2">
                            {/* Nút Served (Chỉ hiện khi tất cả món đã Ready) */}
                            {/* Nút Served (Chỉ hiện khi tất cả món đã Ready) */}
                            {(() => {
                                const allReady = order.items?.every(i => i.status === 'ready' || i.status === 'served');
                                if (!allReady && !isServed) {
                                    return (
                                        <button
                                            disabled
                                            className="w-full py-2 rounded-xl font-bold text-xs border bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">timelapse</span>
                                            {t('waiter.waiting_for_kitchen')}
                                        </button>
                                    );
                                }
                                // Nếu đã phục vụ rồi thì ẩn nút này đi (cho gọn UI)
                                if (isServed) return null;

                                return (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onServed && onServed(order.id, isServed); }}
                                        className="w-full py-2.5 rounded-xl font-bold text-sm border-2 bg-white text-blue-600 border-blue-500 hover:bg-blue-50 cursor-pointer transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm">room_service</span>
                                        {t('waiter.mark_as_served')}
                                    </button>
                                );
                            })()}

                            {/* Nút xác nhận thanh toán cho món đã Served */}
                            {isServed && !isPaid && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onConfirmPayment && onConfirmPayment(order.id); }}
                                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md border-2 border-blue-600 flex items-center justify-center gap-2 transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">payments</span>
                                    {t('waiter.confirm_payment')}
                                </button>
                            )}

                            {/* --- 🟢 NÚT XÁC NHẬN / TỪ CHỐI MÓN MỚI (Quick Action) --- */}
                            {/* Nút xác nhận/từ chối món mới - CHỈ hiện khi order đang processing */}
                            {order.status === 'processing' && order.items?.some(item => item.status === 'pending') && (
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAccept(order.id); // Sẽ chuyển món pending → preparing
                                        }}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-1 transition-all active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-sm">check</span>
                                        <span>Chấp nhận ({order.items.filter(item => item.status === 'pending').length})</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const pendingItems = order.items.filter(item => item.status === 'pending');
                                            const pendingItemIds = pendingItems.map(item => item.id);
                                            onRejectAdditionalItems && onRejectAdditionalItems(order.id, pendingItemIds);
                                        }}
                                        className="bg-white hover:bg-rose-50 text-rose-500 py-2.5 rounded-xl font-bold text-sm border-2 border-rose-300 hover:border-rose-400 flex items-center justify-center gap-1 transition-all active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                        <span>Từ chối</span>
                                    </button>
                                </div>
                            )}
                            {/* --------------------------------------------- */}


                            {isPaid ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onComplete && onComplete(order.id); }}
                                    className="bg-gray-800 hover:bg-black text-white py-2.5 rounded-xl font-bold text-sm shadow-sm w-full flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                    {t('waiter.close_table')}
                                </button>
                            ) : (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
                                    className={`py-2.5 rounded-xl font-bold text-sm w-full flex items-center justify-center gap-2 ${isWaitingPayment
                                        ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-md animate-bounce-short'
                                        : 'bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50'
                                        }`}
                                >
                                    {isWaitingPayment ? (
                                        <>
                                            <span className="material-symbols-outlined text-sm">payments</span>
                                            {t('waiter.customer_request_payment')}
                                        </>
                                    ) : (
                                        t('waiter.payment_details')
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="text-center mt-3">
                    <span className="text-xs text-gray-300 font-medium">{formatDate(order.created_at)}</span>
                </div>
            </div>
        </div>
    );
};

export default OrderCard;