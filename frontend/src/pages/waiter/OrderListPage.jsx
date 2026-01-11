import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import OrderCard from '../../components/waiter/OrderCard';
import OrderDetailModal from '../../components/waiter/OrderDetailModal';

const OrderListPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusFilter, setStatusFilter] = useState('pending'); // pending, processing, completed, cancelled, all

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    const getAuthHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    // ... existing code ...

    const fetchOrders = async () => {
        try {
            setLoading(true);
            let url = `${API_URL}/api/orders`;
            if (statusFilter !== 'all') {
                url += `?status=${statusFilter}`;
            }
            const res = await axios.get(url, getAuthHeader());
            // Sort by updated_at desc (newest first)
            const sorted = res.data.data.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            setOrders(sorted);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch orders');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        const newSocket = io(API_URL);
        newSocket.on('connect', () => {
            newSocket.emit('join_room', 'waiter');
        });

        newSocket.on('new_order', () => fetchOrders());
        newSocket.on('order_status_updated', () => fetchOrders());

        return () => newSocket.close();
    }, [statusFilter]); // Refetch when filter changes

    const handleAccept = async (orderId) => {
        try {
            await axios.put(`${API_URL}/api/orders/${orderId}/status`, { status: 'processing' }, getAuthHeader());
            fetchOrders();
        } catch (err) {
            alert("Failed to accept: " + (err.response?.data?.message || err.message));
        }
    };

    const handleReject = async (orderId) => {
        if (!window.confirm("Reject this order?")) return;
        try {
            await axios.put(`${API_URL}/api/orders/${orderId}/status`, { status: 'cancelled' }, getAuthHeader());
            fetchOrders();
        } catch (err) {
            alert("Failed to reject: " + (err.response?.data?.message || err.message));
        }
    };

    const handleComplete = async (orderId) => {
        if (!window.confirm("Mark this order as completed and table as available?")) return;
        try {
            await axios.put(`${API_URL}/api/orders/${orderId}/status`, { status: 'completed' }, getAuthHeader());
            fetchOrders();
        } catch (err) {
            alert("Failed to complete: " + (err.response?.data?.message || err.message));
        }
    };

    if (loading && orders.length === 0) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg min-h-[80vh]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Order List</h2>
                    <p className="text-gray-500 mt-1">Track and manage customer orders</p>
                </div>

                {/* Filter Dropdown */}
                <div className="relative w-full md:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-emerald-500 font-medium w-full md:w-auto min-w-[150px]"
                    >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="all">All Orders</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                </div>
            </div>

            {error && <div className="text-red-500 mb-4">{error}</div>}

            {
                orders.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        No orders found in "{statusFilter}"
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
                                    onViewDetails={() => setSelectedOrder(order)}
                                />
                            </div>
                        ))}
                    </div>
                )
            }

            {/* Detail Modal */}
            {
                selectedOrder && (
                    <OrderDetailModal
                        order={selectedOrder}
                        onClose={() => setSelectedOrder(null)}
                    />
                )
            }
        </div >
    );
};

export default OrderListPage;
