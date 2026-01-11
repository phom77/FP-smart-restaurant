import React from 'react';

const OrderCard = ({ order, onAccept, onReject, onComplete, onViewDetails }) => {
    // Format currency
    const formatPrice = (price) => {
        return parseInt(price).toLocaleString() + 'đ';
    };

    // Parse date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(dateString).toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full relative group">
            {/* Header: Table Info */}
            <div
                onClick={onViewDetails}
                className="bg-gradient-to-r from-blue-50 to-white p-4 flex justify-between items-center border-b border-blue-50 cursor-pointer hover:bg-blue-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-8 bg-blue-500 rounded-full group-hover:h-10 transition-all"></div>
                    <span className="font-extrabold text-lg text-gray-800">Table {order.table?.table_number || '??'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 font-bold">
                        #{order.id.slice(0, 6)}
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
                        className="text-blue-400 hover:text-blue-600 bg-white hover:bg-blue-100 p-1.5 rounded-full transition-all shadow-sm border border-transparent hover:border-blue-200"
                        title="View Details"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Body: Items */}
            <div className="p-5 flex-1">
                <ul className="space-y-3">
                    {order.items?.map((item) => (
                        <li key={item.id} className="flex justify-between items-start text-sm">
                            <div className="flex-1 pr-2">
                                <span className="font-bold text-gray-800 mr-2">{item.quantity}x</span>
                                <span className="text-gray-700 font-medium">{item.menu_item?.name}</span>
                                {item.modifiers?.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-0.5 ml-5">
                                        {item.modifiers.map(m => m.modifier_name).join(', ')}
                                    </div>
                                )}
                                {item.notes && (
                                    <div className="text-xs text-amber-600 mt-0.5 ml-5 italic">
                                        Note: {item.notes}
                                    </div>
                                )}
                            </div>
                            <span className="text-gray-500 font-medium whitespace-nowrap">
                                {formatPrice(item.total_price)}
                            </span>
                        </li>
                    ))}
                    {(!order.items || order.items.length === 0) && (
                        <li className="text-center text-gray-400 text-sm italic py-2">No items</li>
                    )}
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

                    {order.status === 'completed' && (
                        <div className="bg-gray-100 text-gray-500 py-2.5 rounded-xl font-bold text-sm w-full text-center border border-gray-200 cursor-default">
                            Completed
                        </div>
                    )}

                    {order.status === 'cancelled' && (
                        <div className="bg-red-50 text-red-400 py-2.5 rounded-xl font-bold text-sm w-full text-center border border-red-100 cursor-default">
                            Cancelled
                        </div>
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
