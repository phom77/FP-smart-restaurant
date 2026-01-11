import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../../contexts/SocketContext'; 
import OrderCard from '../../components/waiter/OrderCard';
import OrderDetailModal from '../../components/waiter/OrderDetailModal';

const OrderListPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusFilter, setStatusFilter] = useState('pending');
    
    const socket = useSocket(); // <--- SỬ DỤNG HOOK NÀY

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    const getAuthHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const fetchOrders = async () => {
        try {
            // Không set loading = true ở đây để tránh nháy màn hình khi update realtime
            let url = `${API_URL}/api/orders`;
            if (statusFilter !== 'all') {
                url += `?status=${statusFilter}`;
            }
            const res = await axios.get(url, getAuthHeader());
            const sorted = res.data.data.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            setOrders(sorted);
            setLoading(false); // Chỉ tắt loading lần đầu
        } catch (err) {
            console.error(err);
            // Không setError ở đây để tránh hiện lỗi đỏ lòm khi mạng lag xíu
        }
    };

    // Effect 1: Fetch ban đầu và khi đổi filter
    useEffect(() => {
        setLoading(true);
        fetchOrders();
    }, [statusFilter]);

    // 3. Effect Socket (QUAN TRỌNG: Dependency Array Rỗng [])
    useEffect(() => {
        if (!socket) return;

        // Join room 1 lần duy nhất
        socket.emit('join_room', 'waiter');

        const handleUpdate = () => {
            console.log("🔔 Có update từ Socket");
            // Gọi fetchOrders bên trong này sẽ dùng closure, 
            // nhưng vì fetchOrders phụ thuộc statusFilter (state), 
            // nên ta cần cẩn thận. 
            // Cách tốt nhất: Gọi lại API bất kể filter là gì, hoặc reload nhẹ.
            
            // Ở đây ta gọi hàm fetchOrders() đã định nghĩa ở trên.
            // Lưu ý: Hàm fetchOrders ở đây sẽ lấy giá trị statusFilter tại thời điểm render.
            // Để fix triệt để, ta nên dùng useRef cho statusFilter hoặc bỏ qua filter khi socket báo tin.
            
            // Cách đơn giản nhất cho đồ án:
            window.dispatchEvent(new Event('order_updated')); // Trigger custom event hoặc gọi trực tiếp
        };

        socket.on('new_order', handleUpdate);
        socket.on('order_status_updated', handleUpdate);
        socket.on('item_status_update', handleUpdate);

        return () => {
            socket.off('new_order', handleUpdate);
            socket.off('order_status_updated', handleUpdate);
            socket.off('item_status_update', handleUpdate);
        };
    }, [socket]); // Chỉ chạy lại khi socket object thay đổi (lúc init)

    // 4. Effect phụ để lắng nghe update (Hack nhẹ để refresh đúng state)
    useEffect(() => {
        if (!socket) return;

        socket.emit('join_room', 'waiter');

        // Hàm refresh dữ liệu
        const refreshOrders = () => {
            console.log("🔔 Có thay đổi, đang tải lại danh sách...");
            fetchOrders();
        };

        // Lắng nghe ĐỦ 3 sự kiện này
        socket.on('new_order', refreshOrders);          // 1. Có đơn mới
        socket.on('order_status_updated', refreshOrders); // 2. Đơn đổi trạng thái (Accept/Reject)
        socket.on('item_status_update', refreshOrders);   // 3. QUAN TRỌNG: Bếp nấu xong 1 món -> Refresh ngay

        return () => {
            socket.off('new_order', refreshOrders);
            socket.off('order_status_updated', refreshOrders);
            socket.off('item_status_update', refreshOrders);
        };
    }, [socket, statusFilter]); // Thêm statusFilter để fetch đúng tab hiện tại

    const handleAccept = async (orderId) => {
        try {
            await axios.put(`${API_URL}/api/orders/${orderId}/status`, { status: 'processing' }, getAuthHeader());
            // Không cần fetchOrders() ở đây vì Socket sẽ bắn sự kiện 'order_status_updated' về và tự trigger fetch
        } catch (err) {
            alert("Failed to accept: " + (err.response?.data?.message || err.message));
        }
    };

    const handleReject = async (orderId) => {
        if (!window.confirm("Reject this order?")) return;
        try {
            await axios.put(`${API_URL}/api/orders/${orderId}/status`, { status: 'cancelled' }, getAuthHeader());
        } catch (err) {
            alert("Failed to reject: " + (err.response?.data?.message || err.message));
        }
    };

    const handleComplete = async (orderId) => {
        if (!window.confirm("Mark this order as completed?")) return;
        try {
            await axios.put(`${API_URL}/api/orders/${orderId}/status`, { status: 'completed' }, getAuthHeader());
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
                </div>
            </div>

            {error && <div className="text-red-500 mb-4">{error}</div>}

            {orders.length === 0 ? (
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