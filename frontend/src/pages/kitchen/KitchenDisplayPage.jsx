import { useState, useEffect, useMemo } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function KitchenDisplayPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSummary, setShowSummary] = useState(false);
    const socket = useSocket();
    const { user } = useAuth();

    // 1. Fetch dữ liệu
    const fetchKitchenOrders = async () => {
        try {
            const res = await api.get('/api/kitchen/items');
            if (res.data.success) {
                setOrders(res.data.data);
            }
        } catch (err) {
            console.error("Lỗi tải đơn bếp:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKitchenOrders();
    }, []);

    // 2. SOCKET REALTIME
    useEffect(() => {
        if (!socket) return;
        
        console.log("👨‍🍳 Bếp joining room...");
        socket.emit('join_room', 'kitchen');

        // Khi Waiter duyệt đơn -> Sự kiện 'new_order' được bắn vào room 'kitchen'
        const handleNewOrder = (data) => {
            console.log("🔔 Bếp nhận đơn mới:", data);
            const audio = new Audio('/notification.mp3'); // Đảm bảo file này có trong public folder
            audio.play().catch(() => {});
            toast.success("🔔 Có đơn mới cần nấu!");
            fetchKitchenOrders();
        };

        // Khi đồng đội update 1 món
        const handleItemUpdate = (data) => {
            setOrders(prevOrders => prevOrders.map(order => {
                if (order.id !== data.order_id) return order;
                return {
                    ...order,
                    order_items: order.order_items.map(item => 
                        item.id === data.itemId ? { ...item, status: data.status } : item
                    )
                };
            }));
        };

        socket.on('new_order', handleNewOrder);
        socket.on('kitchen_item_update', handleItemUpdate);

        return () => {
            socket.off('new_order', handleNewOrder);
            socket.off('kitchen_item_update', handleItemUpdate);
        };
    }, [socket]);

    // 3. Xử lý Update Status (Nấu xong)
    const handleUpdateItem = async (itemId, newStatus) => {
        try {
            // Optimistic Update
            setOrders(prev => prev.map(order => ({
                ...order,
                order_items: order.order_items.map(item => 
                    item.id === itemId ? { ...item, status: newStatus } : item
                )
            })));

            await api.put(`/api/kitchen/items/${itemId}`, { status: newStatus });
            
        } catch (err) {
            toast.error("Lỗi cập nhật");
            fetchKitchenOrders();
        }
    };

    // Helper: Thống kê gom nhóm cho Modal
    const summaryData = useMemo(() => {
        const summary = {};
        orders.forEach(order => {
            order.order_items.forEach(item => {
                if (item.status === 'ready') return;
                const key = item.menu_items?.name || 'Unknown';
                if (!summary[key]) summary[key] = { count: 0, notes: [] };
                summary[key].count += item.quantity;
                if (item.notes) summary[key].notes.push(item.notes);
            });
        });
        return Object.entries(summary).sort((a, b) => b[1].count - a[1].count);
    }, [orders]);

    // UI Helpers
    const getElapsedTime = (createdAt) => {
        const diff = Math.floor((new Date() - new Date(createdAt)) / 60000);
        return diff + 'm';
    };
    
    const getHeaderColor = (createdAt) => {
        const diff = Math.floor((new Date() - new Date(createdAt)) / 60000);
        if (diff > 20) return 'bg-red-600';
        if (diff > 10) return 'bg-yellow-600';
        return 'bg-blue-600';
    };

    if (loading) return <div className="p-8 text-center">Đang tải dữ liệu bếp...</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-4">
             {/* Header */}
             <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">KDS - Màn Hình Bếp</h1>
                    <p className="text-gray-500">Đang có {orders.length} đơn hàng cần xử lý</p>
                </div>
                <button 
                    onClick={() => setShowSummary(true)}
                    className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-gray-800 shadow-lg transition"
                >
                    <span className="material-symbols-outlined">analytics</span>
                    Tổng hợp món ({summaryData.reduce((acc, [_, v]) => acc + v.count, 0)})
                </button>
            </header>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-auto pb-10">
                {orders.map(order => (
                    <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-fit animate-fade-in-up">
                        {/* Order Header */}
                        <div className={`${getHeaderColor(order.created_at)} text-white p-3 flex justify-between items-center`}>
                            <div>
                                <h3 className="text-lg font-bold">Bàn {order.tables?.table_number}</h3>
                                <p className="text-xs opacity-90">#{order.id.slice(0, 6)}</p>
                            </div>
                            <div className="text-xl font-mono font-bold">
                                {getElapsedTime(order.created_at)}
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="p-2 flex-1">
                            <ul className="divide-y divide-gray-100">
                                {order.order_items.map(item => (
                                    <li key={item.id} className="py-2 px-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-lg text-gray-800">{item.quantity}x</span>
                                                    <span className="font-medium text-gray-800">{item.menu_items?.name}</span>
                                                </div>
                                                {item.order_item_modifiers?.length > 0 && (
                                                    <p className="text-xs text-gray-500 pl-6">
                                                        + {item.order_item_modifiers.map(m => m.modifier_name).join(', ')}
                                                    </p>
                                                )}
                                                {item.notes && (
                                                    <p className="text-xs text-red-500 font-bold pl-6 italic">
                                                        Note: {item.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 pl-6">
                                            {/* Trạng thái Preparing -> Ready */}
                                            {item.status === 'preparing' && (
                                                <button 
                                                    onClick={() => handleUpdateItem(item.id, 'ready')}
                                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm transition active:scale-95"
                                                >
                                                    Hoàn Tất
                                                </button>
                                            )}
                                            {/* Trạng thái Ready */}
                                            {item.status === 'ready' && (
                                                <span className="flex-1 text-center text-green-600 font-bold text-xs py-2 bg-green-50 rounded-lg border border-green-100">
                                                    ✔ Đã Xong
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
                
                {orders.length === 0 && !loading && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                        <span className="material-symbols-outlined text-6xl mb-4">soup_kitchen</span>
                        <p className="text-xl font-medium">Hiện chưa có đơn nào cần nấu</p>
                    </div>
                )}
            </div>

            {/* Summary Modal */}
            {showSummary && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-gray-800">Tổng hợp cần nấu</h2>
                            <button onClick={() => setShowSummary(false)} className="text-gray-400 hover:text-gray-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            <table className="w-full">
                                <thead className="text-gray-500 text-xs uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left rounded-l-lg">Tên Món</th>
                                        <th className="px-4 py-2 text-right rounded-r-lg">SL</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {summaryData.map(([name, data]) => (
                                        <tr key={name}>
                                            <td className="px-4 py-3 font-medium text-gray-800">
                                                {name}
                                                {data.notes.length > 0 && (
                                                    <div className="text-xs text-red-500 font-normal mt-1">
                                                        ⚠️ {data.notes.length} ghi chú
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-xl text-blue-600">
                                                {data.count}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}