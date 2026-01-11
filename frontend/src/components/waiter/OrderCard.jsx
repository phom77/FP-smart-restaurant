import React from 'react';

const OrderCard = ({ order, onAccept, onReject, onComplete, onViewDetails }) => {
    // Format currency an toàn
    const formatPrice = (price) => {
        return parseInt(price || 0).toLocaleString() + 'đ';
    };

    // Parse date an toàn
    const formatDate = (dateString) => {
        if (!dateString) return 'Just now';
        try {
            return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return 'Invalid date';
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
                    {/* THÊM ?. ĐỂ TRÁNH CRASH NẾU TABLE NULL */}
                    <span className="font-extrabold text-lg text-gray-800">
                        Table {order.table?.table_number || 'N/A'}
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
                            <span className="text-gray-500">Tiến độ bếp</span>
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
                {/* --------------------------------------- */}

                <ul className="space-y-3">
                    {order.items?.map((item, index) => (
                        <li key={item.id || index} className="flex justify-between items-start text-sm">
                            <div className="flex-1 pr-2">
                                <span className="font-bold text-gray-800 mr-2">{item.quantity}x</span>
                                <span className="text-gray-700 font-medium">{item.menu_item?.name || 'Unknown'}</span>
                                
                                {/* Hiển thị trạng thái từng món nhỏ */}
                                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded border ${
                                    item.status === 'ready' ? 'bg-green-100 text-green-700 border-green-200' :
                                    item.status === 'preparing' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                    'bg-gray-100 text-gray-500 border-gray-200'
                                }`}>
                                    {item.status}
                                </span>
                                {/* ... modifiers ... */}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Footer: Total & Actions */}
            <div className="p-5 pt-0 mt-auto">
                <div className="flex justify-between items-end mb-4 border-t border-dashed border-gray-100 pt-4">
                    <span className="text-gray-500 font-medium text-xs uppercase tracking-wider">Total</span>
                    <span className="text-2xl font-extrabold text-blue-600 leading-none">
                        {formatPrice(order.total_amount)}
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {order.status === 'pending' && (
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); onAccept(order.id); }}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95"
                            >
                                Accept
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onReject(order.id); }}
                                className="bg-white hover:bg-rose-50 text-rose-500 py-2.5 rounded-xl font-bold text-sm border border-rose-100 hover:border-rose-200 transition-all active:scale-95"
                            >
                                Reject
                            </button>
                        </div>
                    )}

                    {order.status === 'processing' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onComplete && onComplete(order.id); }}
                            className="bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 w-full"
                        >
                            Mark Completed
                        </button>
                    )}
                     {/* Các trạng thái khác giữ nguyên */}
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