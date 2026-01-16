import { useState, useEffect, useMemo } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function KitchenDisplayPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSummary, setShowSummary] = useState(false);
    const socket = useSocket();

    // ========== 1. FETCH DỮ LIỆU ==========
    const fetchKitchenOrders = async () => {
        try {
            const res = await api.get('/api/kitchen/items');
            if (res.data.success) {
                setOrders(res.data.data);
            }
        } catch (err) {
            console.error("❌ Lỗi tải đơn bếp:", err);
            toast.error("Không thể tải đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKitchenOrders();
    }, []);

    // ========== 2. SOCKET REALTIME ==========
    useEffect(() => {
        if (!socket) return;
        
        console.log("👨‍🍳 Bếp đang join room 'kitchen'...");
        socket.emit('join_room', 'kitchen');

        // ✅ A. Khi Waiter duyệt đơn (pending → processing)
        const handleNewOrder = (data) => {
            console.log("🔔 Bếp nhận đơn mới:", data);
            
            // Play sound
            try {
                const audio = new Audio('/notification.mp3');
                audio.play().catch(() => {});
            } catch (e) {}
            
            toast.success(`📢 Có đơn mới: Bàn ${data.table_number || data.table_id}`);
            
            // Refresh lại danh sách
            fetchKitchenOrders();
        };

        // ✅ B. Khi đồng đội update 1 món (preparing → ready)
        const handleItemUpdate = (data) => {
            console.log("🔄 Kitchen item update:", data);
            
            // Optimistic update
            setOrders(prevOrders => prevOrders.map(order => {
                if (order.id !== data.order_id) return order;
                return {
                    ...order,
                    order_items: order.order_items.map(item => 
                        item.id === data.itemId 
                            ? { ...item, status: data.status } 
                            : item
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

    // ========== 3. XỬ LÝ CẬP NHẬT STATUS ==========
    const handleUpdateItem = async (itemId, newStatus) => {
        try {
            // Optimistic update UI
            setOrders(prev => prev.map(order => ({
                ...order,
                order_items: order.order_items.map(item => 
                    item.id === itemId ? { ...item, status: newStatus } : item
                )
            })));

            await api.put(`/api/kitchen/items/${itemId}`, { status: newStatus });
            toast.success(`✅ Đã cập nhật món`);
            
        } catch (err) {
            console.error("❌ Lỗi cập nhật:", err);
            toast.error("Lỗi cập nhật món");
            fetchKitchenOrders(); // Rollback
        }
    };

    // ========== 4. TỔNG HỢP THEO MÓN (CHO MODAL) ==========
    const summaryData = useMemo(() => {
        const summary = {};
        
        orders.forEach(order => {
            order.order_items.forEach(item => {
                // Chỉ tính món chưa xong
                if (item.status === 'ready' || item.status === 'served') return;
                
                const key = item.menu_items?.name || 'Unknown';
                if (!summary[key]) {
                    summary[key] = { 
                        count: 0, 
                        notes: [],
                        preparing: 0,
                        pending: 0
                    };
                }
                
                summary[key].count += item.quantity;
                if (item.notes) summary[key].notes.push(item.notes);
                if (item.status === 'preparing') summary[key].preparing += item.quantity;
                if (item.status === 'pending') summary[key].pending += item.quantity;
            });
        });
        
        return Object.entries(summary).sort((a, b) => b[1].count - a[1].count);
    }, [orders]);

    // ========== 5. UI HELPERS ==========
    const getElapsedTime = (createdAt) => {
        const diff = Math.floor((new Date() - new Date(createdAt)) / 60000);
        if (diff < 1) return 'Mới';
        return diff + 'm';
    };
    
    const getHeaderColor = (createdAt) => {
        const diff = Math.floor((new Date() - new Date(createdAt)) / 60000);
        if (diff > 20) return 'bg-red-600';
        if (diff > 10) return 'bg-yellow-500';
        return 'bg-emerald-600';
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Chờ' },
            preparing: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Đang nấu' },
            ready: { bg: 'bg-green-100', text: 'text-green-700', label: 'Xong' },
        };
        return badges[status] || badges.pending;
    };

    // ========== 6. RENDER ==========
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Đang tải dữ liệu bếp...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            {/* ========== HEADER ========== */}
            <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">🍳 Kitchen Display System</h1>
                    <p className="text-gray-500">
                        Đang có <span className="font-bold text-emerald-600">{orders.length}</span> đơn hàng cần xử lý
                    </p>
                </div>
                <button 
                    onClick={() => setShowSummary(true)}
                    className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-gray-800 shadow-lg transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined">analytics</span>
                    Tổng hợp món ({summaryData.reduce((acc, [_, v]) => acc + v.count, 0)})
                </button>
            </header>

            {/* ========== ORDERS GRID ========== */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {orders.map(order => {
                    const allReady = order.order_items.every(item => item.status === 'ready');
                    
                    return (
                        <div 
                            key={order.id} 
                            className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden flex flex-col transition-all ${
                                allReady ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200'
                            }`}
                        >
                            {/* Order Header */}
                            <div className={`${getHeaderColor(order.created_at)} text-white p-4 flex justify-between items-center`}>
                                <div>
                                    <h3 className="text-xl font-bold">Bàn {order.tables?.table_number}</h3>
                                    <p className="text-xs opacity-90 font-mono">#{order.id.slice(0, 8)}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold font-mono">{getElapsedTime(order.created_at)}</div>
                                    {allReady && (
                                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full animate-pulse">
                                            ✓ Xong hết
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="p-3 flex-1 space-y-3">
                                {order.order_items.map(item => {
                                    const badge = getStatusBadge(item.status);
                                    
                                    return (
                                        <div key={item.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                                            {/* Item Info */}
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-xl text-gray-800 bg-white px-2 py-0.5 rounded">
                                                            {item.quantity}x
                                                        </span>
                                                        <span className="font-semibold text-gray-800">
                                                            {item.menu_items?.name}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Modifiers */}
                                                    {item.order_item_modifiers?.length > 0 && (
                                                        <p className="text-xs text-gray-600 ml-11">
                                                            + {item.order_item_modifiers.map(m => m.modifier_name).join(', ')}
                                                        </p>
                                                    )}
                                                    
                                                    {/* Notes */}
                                                    {item.notes && (
                                                        <p className="text-xs text-red-600 font-bold ml-11 mt-1 italic bg-red-50 px-2 py-1 rounded">
                                                            📝 {item.notes}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                {/* Status Badge */}
                                                <span className={`${badge.bg} ${badge.text} px-2 py-1 rounded text-xs font-bold`}>
                                                    {badge.label}
                                                </span>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2">
                                                {item.status === 'pending' && (
                                                    <button 
                                                        onClick={() => handleUpdateItem(item.id, 'preparing')}
                                                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm transition-all active:scale-95"
                                                    >
                                                        Bắt đầu nấu
                                                    </button>
                                                )}
                                                
                                                {item.status === 'preparing' && (
                                                    <button 
                                                        onClick={() => handleUpdateItem(item.id, 'ready')}
                                                        className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm transition-all active:scale-95"
                                                    >
                                                        ✓ Hoàn tất
                                                    </button>
                                                )}
                                                
                                                {item.status === 'ready' && (
                                                    <div className="flex-1 text-center text-green-600 font-bold text-sm py-2 bg-green-50 rounded-lg border-2 border-green-200">
                                                        ✓ Đã xong
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Order Footer */}
                            <div className="p-3 bg-gray-50 border-t border-gray-200">
                                <div className="text-xs text-gray-500 text-center">
                                    Đặt lúc: {new Date(order.created_at).toLocaleTimeString('vi-VN')}
                                </div>
                            </div>
                        </div>
                    );
                })}
                
                {/* Empty State */}
                {orders.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                        <span className="material-symbols-outlined text-7xl mb-4">soup_kitchen</span>
                        <p className="text-xl font-medium">Hiện chưa có đơn nào cần nấu</p>
                        <p className="text-sm text-gray-400 mt-2">Đơn mới sẽ xuất hiện tự động</p>
                    </div>
                )}
            </div>

            {/* ========== SUMMARY MODAL ========== */}
            {showSummary && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="p-5 border-b flex justify-between items-center bg-gradient-to-r from-emerald-50 to-white rounded-t-2xl">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">📊 Tổng hợp món cần nấu</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Tổng cộng: {summaryData.reduce((acc, [_, v]) => acc + v.count, 0)} món
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowSummary(false)} 
                                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition"
                            >
                                <span className="material-symbols-outlined text-2xl">close</span>
                            </button>
                        </div>
                        
                        {/* Modal Body */}
                        <div className="p-5 overflow-y-auto flex-1">
                            <table className="w-full">
                                <thead className="text-gray-600 text-xs uppercase bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left rounded-l-lg">Tên Món</th>
                                        <th className="px-4 py-3 text-center">Chờ</th>
                                        <th className="px-4 py-3 text-center">Đang nấu</th>
                                        <th className="px-4 py-3 text-right rounded-r-lg">Tổng SL</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {summaryData.map(([name, data]) => (
                                        <tr key={name} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 font-medium text-gray-800">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                                    {name}
                                                </div>
                                                {data.notes.length > 0 && (
                                                    <div className="text-xs text-red-500 font-normal mt-1 ml-4">
                                                        ⚠️ {data.notes.length} ghi chú
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold">
                                                    {data.pending}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">
                                                    {data.preparing}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="font-bold text-2xl text-emerald-600">
                                                    {data.count}
                                                </span>
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