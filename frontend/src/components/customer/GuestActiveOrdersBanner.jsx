import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { getGuestOrders } from '../../utils/guestOrders';

const GuestActiveOrdersBanner = () => {
    const [activeOrders, setActiveOrders] = useState([]);
    const location = useLocation();

    // Check for active orders periodically and on mount
    useEffect(() => {
        const checkActiveOrders = async () => {
            const guestOrderIds = getGuestOrders();
            if (!guestOrderIds || guestOrderIds.length === 0) {
                setActiveOrders([]);
                return;
            }

            try {
                const res = await api.post('/api/orders/lookup', { orderIds: guestOrderIds });

                if (res.data.success) {
                    // Filter orders that are active (pending, processing, waiting_payment)
                    // and NOT currently being viewed (optional, but good UX)
                    const active = res.data.data.filter(o =>
                        ['pending', 'processing', 'waiting_payment'].includes(o.status)
                    );
                    setActiveOrders(active);
                }
            } catch (err) {
                console.error("Error checking guest orders:", err);
            }
        };

        checkActiveOrders();

        // Refresh every 30 seconds
        const interval = setInterval(checkActiveOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    // Helper to check if we are currently viewing this specific order
    const isViewingOrder = (orderId) => {
        return location.pathname === `/orders/${orderId}`;
    };

    // Filter out orders currently being viewed
    const visibleOrders = activeOrders.filter(order => !isViewingOrder(order.id));

    if (visibleOrders.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 items-end">
            {visibleOrders.map(order => (
                <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="group bg-white border-l-4 border-blue-500 shadow-xl p-4 rounded-r-xl flex items-center justify-between gap-4 animate-slide-in-right hover:bg-blue-50 transition-all max-w-sm cursor-pointer ring-1 ring-gray-100"
                >
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                                {order.status === 'waiting_payment' ? 'Chờ thanh toán' : 'Đang xử lý'}
                            </span>
                        </div>
                        <p className="font-bold text-gray-800 mt-1">Đơn hàng bàn {order.table_number}</p>
                        <p className="text-xs text-gray-500">{parseInt(order.total_amount).toLocaleString()}đ • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>

                    <div className="bg-blue-100 p-2 rounded-full group-hover:bg-blue-200 transition-colors">
                        <span className="material-symbols-outlined text-blue-600 text-xl">arrow_forward</span>
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default GuestActiveOrdersBanner;
