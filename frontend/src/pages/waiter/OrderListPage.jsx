import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../../contexts/SocketContext';
import OrderCard from '../../components/waiter/OrderCard';
import OrderDetailModal from '../../components/waiter/OrderDetailModal';
import { useTranslation } from 'react-i18next';

const OrderListPage = () => {
    const { t } = useTranslation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 8;

    const socket = useSocket();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    const getAuthHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const fetchOrders = async () => {
        try {
            let url = `${API_URL}/api/orders?page=${currentPage}&limit=${ITEMS_PER_PAGE}`;
            if (statusFilter === 'served') {
                url += `&status=processing&is_served=true`;
            } else if (statusFilter === 'processing') {
                url += `&status=processing&is_served=false`;
            } else if (statusFilter !== 'all') {
                url += `&status=${statusFilter}`;
            }
            const res = await axios.get(url, getAuthHeader());
            // Backend returns { success, data, pagination: { total, page, limit, totalPages } }
            setOrders(res.data.data);
            setTotalPages(res.data.pagination?.totalPages || 1);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1); // Reset to first page when filter changes
    }, [statusFilter]);

    useEffect(() => {
        setLoading(true);
        fetchOrders();

        // Request notification permission
        if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    }, [statusFilter, currentPage]);

    useEffect(() => {
        if (!socket) return;

        socket.emit('join_room', 'waiter');

        const refreshOrders = () => {
            console.log("🔄 Refreshing orders...");
            fetchOrders();
        };

        // Helper notification function
        const showNotification = (title, body) => {
            if (!("Notification" in window)) return;

            if (Notification.permission === "granted") {
                new Notification(title, { body });
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        new Notification(title, { body });
                    }
                });
            }
        };

        // ✅ SOCKET LISTENERS - MỖI EVENT CHỈ 1 LẦN
        const handleNewOrder = (data) => {
            if (data?.message) {
                showNotification('🔔 Đơn hàng mới / Cập nhật', data.message);
            } else {
                showNotification('🔔 Đơn hàng mới', 'Có đơn hàng mới chờ xác nhận');
            }
            refreshOrders();
        };

        const handleItemUpdate = (data) => {
            if (data.status === 'ready') {
                showNotification('👨‍🍳 Bếp đã nấu xong', `Món ăn cho đơn #${data.order_id?.slice(0, 8)} đã sẵn sàng phục vụ!`);
            }
            refreshOrders();
        };

        const handlePaymentRequest = (data) => {
            const invoiceText = data.requestInvoice ? ' - CẦN HÓA ĐƠN VAT ✓' : '';
            showNotification(
                '💰 Yêu cầu thanh toán',
                `Bàn ${data.tableNumber || data.tableId || '???'} yêu cầu thanh toán ${data.method === 'cash' ? 'Tiền mặt' : 'Thẻ'}${invoiceText}`
            );
            refreshOrders();
        };


        socket.on('new_order', handleNewOrder);
        socket.on('order_status_updated', refreshOrders);
        socket.on('item_status_update', handleItemUpdate);
        socket.on('payment_request', handlePaymentRequest);
        socket.on('order_paid', refreshOrders);
        socket.on('order_served_update', refreshOrders);

        return () => {
            socket.off('new_order', handleNewOrder);
            socket.off('order_status_updated', refreshOrders);
            socket.off('item_status_update', handleItemUpdate);
            socket.off('payment_request', handlePaymentRequest);
            socket.off('order_paid', refreshOrders);
            socket.off('order_served_update', refreshOrders);
        };
    }, [socket, statusFilter, currentPage]);

    const handleAccept = async (orderId) => {
        try {
            await axios.put(`${API_URL}/api/orders/${orderId}/status`, { status: 'processing' }, getAuthHeader());
        } catch (err) {
            alert(t('common.failed') + ": " + (err.response?.data?.message || err.message));
        }
    };

    const handleReject = async (orderId) => {
        if (!window.confirm(t('waiter.reject_confirm'))) return;
        try {
            await axios.put(`${API_URL}/api/orders/${orderId}/status`, { status: 'cancelled' }, getAuthHeader());
        } catch (err) {
            alert(t('common.failed') + ": " + (err.response?.data?.message || err.message));
        }
    };

    const handleComplete = async (orderId) => {
        if (!window.confirm(t('waiter.complete_confirm'))) return;
        try {
            await axios.put(`${API_URL}/api/orders/${orderId}/status`, { status: 'completed' }, getAuthHeader());
        } catch (err) {
            alert(t('common.failed') + ": " + (err.response?.data?.message || err.message));
        }
    };

    const handleServed = async (orderId, currentStatus) => {
        try {
            await axios.put(`${API_URL}/api/orders/${orderId}/served`, { is_served: !currentStatus }, getAuthHeader());
        } catch (err) {
            alert(t('common.failed') + ": " + (err.response?.data?.message || err.message));
        }
    };

    const handleRejectAdditionalItems = async (orderId, itemIds) => {
        if (!window.confirm(`Bạn có chắc muốn từ chối ${itemIds.length} món này?`)) return;
        try {
            await axios.delete(`${API_URL}/api/orders/${orderId}/items`, {
                ...getAuthHeader(),
                data: { itemIds }
            });
            // Close modal if it's open for this order
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(null);
            }
            // Orders will refresh automatically via socket event
        } catch (err) {
            alert(t('common.failed') + ": " + (err.response?.data?.message || err.message));
        }
    };


    const handleConfirmPayment = async (orderId) => {
        if (!window.confirm("Xác nhận đã thu tiền đơn này?")) return;
        try {
            await axios.post(`${API_URL}/api/payment/confirm-cash`, { orderId }, getAuthHeader());
        } catch (err) {
            alert(t('common.failed') + ": " + (err.response?.data?.message || err.message));
        }
    };

    if (loading && orders.length === 0) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg min-h-[80vh] flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">{t('waiter.order_list')}</h2>
                    <p className="text-gray-500 mt-1">{t('waiter.track_orders')}</p>
                </div>

                <div className="relative w-full md:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-5 pr-10 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-emerald-500 font-bold w-full md:w-auto min-w-[180px] shadow-sm transition-all"
                    >
                        <option value="pending">{t('waiter.status.pending')}</option>
                        <option value="processing">{t('waiter.status.processing')}</option>
                        <option value="served">{t('waiter.status.served') || 'Đã phục vụ'}</option>
                        <option value="completed">{t('waiter.status.completed')}</option>
                        <option value="cancelled">{t('waiter.status.cancelled')}</option>
                        <option value="all">{t('waiter.all_orders')}</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                </div>
            </div>

            {error && <div className="text-red-500 mb-4">{error}</div>}

            <div className="flex-1">
                {orders.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-medium">
                        {t('waiter.no_orders', { status: statusFilter === 'all' ? t('waiter.all_orders') : (statusFilter === 'served' ? 'Đã phục vụ' : t(`waiter.status.${statusFilter}`)) })}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {orders.map(order => (
                            <div key={order.id} className="h-full">
                                <OrderCard
                                    order={order}
                                    onAccept={handleAccept}
                                    onReject={handleReject}
                                    onComplete={handleComplete}
                                    onServed={handleServed}
                                    onConfirmPayment={handleConfirmPayment}
                                    onRejectAdditionalItems={handleRejectAdditionalItems}
                                    onViewDetails={() => setSelectedOrder(order)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-12 flex flex-wrap justify-center items-center gap-2 md:gap-4 py-6 border-t border-gray-50 bg-gray-50/30 rounded-b-2xl">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`p-2.5 rounded-xl border transition-all ${currentPage === 1
                            ? 'text-gray-300 border-gray-100 cursor-not-allowed bg-white'
                            : 'text-emerald-600 border-emerald-100 bg-white hover:bg-emerald-50 hover:shadow-sm active:scale-95'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-1.5 md:gap-2">
                        {(() => {
                            const pages = [];
                            const delta = 1; // Number of pages to show around current page

                            for (let i = 1; i <= totalPages; i++) {
                                if (
                                    i === 1 || // Always show first
                                    i === totalPages || // Always show last
                                    (i >= currentPage - delta && i <= currentPage + delta) // Show window
                                ) {
                                    if (pages.length > 0 && i - pages[pages.length - 1] > 1) {
                                        pages.push('...');
                                    }
                                    pages.push(i);
                                }
                            }

                            return pages.map((page, idx) => (
                                page === '...' ? (
                                    <span key={`dots-${idx}`} className="px-2 text-gray-400 font-bold select-none">...</span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-9 h-9 md:w-11 md:h-11 rounded-xl font-bold transition-all flex items-center justify-center text-sm md:text-base ${currentPage === page
                                            ? 'bg-emerald-500 text-white shadow-lg scale-110'
                                            : 'bg-white text-gray-600 border border-gray-100 hover:border-emerald-200 hover:text-emerald-600 hover:shadow-sm'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                )
                            ));
                        })()}
                    </div>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className={`p-2.5 rounded-xl border transition-all ${currentPage === totalPages
                            ? 'text-gray-300 border-gray-100 cursor-not-allowed bg-white'
                            : 'text-emerald-600 border-emerald-100 bg-white hover:bg-emerald-50 hover:shadow-sm active:scale-95'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            )}

            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
        </div>
    );
};

export default OrderListPage;