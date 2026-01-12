import React from 'react';
import { useTranslation } from 'react-i18next';

const OrderCard = ({ order, onAccept, onReject, onComplete, onViewDetails }) => {
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

    // Bảo vệ: Nếu order null thì không render
    if (!order) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full relative group">
            {/* Header: Table Info */}
            <div
                onClick={onViewDetails}
                className="bg-gradient-to-r from-blue-50 to-white p-4 flex justify-between items-center border-b border-blue-50 cursor-pointer hover:bg-blue-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-8 rounded-full transition-all ${order.status === 'pending' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                    <span className="font-extrabold text-lg text-gray-800">
                        {t('waiter.table')} {order.table?.table_number || 'N/A'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 font-bold">
                        #{order.id?.slice(0, 6)}
                    </span>
                </div>
            </div>

            {/* Body: Items */}
            <div className="p-5 flex-1">

                {order.status === 'processing' && (
                    <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">{t('waiter.kitchen_progress')}</span>
                            <span className="font-bold text-blue-600">
                                {order.items.filter(i => i.status === 'ready' || i.status === 'served').length} / {order.items.length}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(order.items.filter(i => i.status === 'ready' || i.status === 'served').length / order.items.length) * 100}%` }}
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
                                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-tighter ${item.status === 'ready' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        item.status === 'preparing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            item.status === 'served' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                'bg-gray-50 text-gray-500 border-gray-100'
                                    }`}>
                                    {t(`waiter.status.${item.status}`)}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Footer: Total & Actions */}
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
                        <button
                            onClick={(e) => { e.stopPropagation(); onComplete && onComplete(order.id); }}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 w-full flex items-center justify-center gap-2"
                        >
                            <span>{t('waiter.mark_completed')}</span>
                        </button>
                    )}
                </div>

                <div className="text-center mt-3">
                    <span className="text-xs text-gray-300 font-medium">
                        {formatDate(order.created_at)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default OrderCard;