import { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function KitchenDisplayPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); 
    const socket = useSocket();
    const { user } = useAuth();

    // 1. Hàm lấy dữ liệu (Tách rời để gọi lại được)
    const fetchKitchenItems = async () => {
        try {
            // Không set loading=true ở đây để tránh nháy màn hình
            const res = await api.get('/api/kitchen/items');
            if (res.data.success) {
                setItems(res.data.data);
            }
        } catch (err) {
            console.error("Lỗi tải món:", err);
        } finally {
            setLoading(false);
        }
    };

    // 2. Fetch lần đầu khi vào trang
    useEffect(() => {
        setLoading(true);
        fetchKitchenItems();
    }, []);

    // 3. Xử lý Socket (QUAN TRỌNG: Dependency chỉ có [socket])
    useEffect(() => {
        if (!socket) return;

        // A. Join Room Kitchen (Chỉ chạy 1 lần khi mount)
        console.log("👨‍🍳 Bếp joining room: kitchen");
        socket.emit('join_room', 'kitchen');

        // B. Định nghĩa hàm xử lý
        const handleNewOrder = (data) => {
            console.log("🔔 Bếp nhận đơn mới:", data);
            // Play sound
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {});
            
            // Reload lại danh sách món
            fetchKitchenItems();
        };

        // C. Lắng nghe sự kiện
        socket.on('new_order', handleNewOrder);

        // D. Cleanup (Gỡ sự kiện khi rời trang)
        return () => {
            socket.off('new_order', handleNewOrder);
            // Optional: socket.emit('leave_room', 'kitchen');
        };
    }, [socket]); 

    // 4. Xử lý chuyển trạng thái (Nấu -> Xong)
    const handleStatusChange = async (group, newStatus) => {
        try {
            // Optimistic Update: Ẩn nhóm đó đi ngay lập tức
            setItems(prev => prev.filter(i => i.signature !== group.signature));

            // Gọi API update cho TẤT CẢ các item con trong nhóm
            // Dùng Promise.all để chạy song song cho nhanh
            await Promise.all(group.ids.map(id => 
                api.put(`/api/kitchen/items/${id}`, { status: newStatus })
            ));
            
            // Sau khi xong, fetch lại để đồng bộ chuẩn xác
            fetchKitchenItems();

        } catch (err) {
            console.error("Lỗi cập nhật:", err);
            fetchKitchenItems();
        }
    };

    // ... (Giữ nguyên các hàm helper getElapsedTime, getTimeColor, filter logic) ...
    // Helper: Tính thời gian chờ
    const getElapsedTime = (createdAt) => {
        const diff = new Date() - new Date(createdAt);
        const minutes = Math.floor(diff / 60000);
        return `${minutes}m`;
    };

    const getTimeColor = (createdAt) => {
        const minutes = Math.floor((new Date() - new Date(createdAt)) / 60000);
        if (minutes >= 15) return 'bg-red-100 text-red-700 border-red-200';
        if (minutes >= 10) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        return 'bg-green-100 text-green-700 border-green-200';
    };

    const filteredItems = items.filter(item => {
        if (filter === 'all') return item.status !== 'served';
        return item.status === filter;
    });

    if (loading) return <div className="p-8 text-center">Đang tải dữ liệu bếp...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#191919] flex flex-col">
            {/* Header */}
            <header className="bg-white dark:bg-[#202020] border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex justify-between items-center sticky top-0 z-10">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">KDS - Bếp</h1>
                    <p className="text-xs text-gray-500">Station: Grill • User: {user?.full_name}</p>
                </div>
                <div className="flex gap-2">
                    {['all', 'pending', 'preparing', 'ready'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium capitalize transition-colors ${
                                filter === f 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}
                        >
                            {/* Đếm số lượng nhóm thẻ */}
                            {f} ({items.filter(i => f === 'all' ? i.status !== 'served' : i.status === f).length})
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Grid */}
            <main className="flex-1 p-4 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredItems.map(group => (
                        <div key={group.signature} className="bg-white dark:bg-[#202020] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                            
                            {/* Card Header */}
                            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start">
                                <div>
                                    {/* Hiển thị danh sách bàn (VD: Bàn: T1, T2) */}
                                    <span className="text-xs font-bold text-gray-500 uppercase">
                                        Bàn: {group.table_list}
                                    </span>
                                    {/* Hiển thị tổng số lượng gộp */}
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                        {group.total_quantity}x {group.name}
                                    </h3>
                                </div>
                                {/* Timer tính theo món đợi lâu nhất trong nhóm */}
                                <div className={`px-2 py-1 rounded text-xs font-bold border ${getTimeColor(group.created_at)}`}>
                                    {getElapsedTime(group.created_at)}
                                </div>
                            </div>

                            {/* Modifiers & Notes */}
                            <div className="p-4 flex-1 bg-gray-50 dark:bg-[#252525]">
                                {group.modifiers && group.modifiers.length > 0 && (
                                    <ul className="mb-2 space-y-1">
                                        {group.modifiers.map((mod, idx) => (
                                            <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                                {mod}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {group.notes && (
                                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-2 rounded border border-red-100 dark:border-red-900/30 font-medium">
                                        ⚠️ {group.notes}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-3 bg-white dark:bg-[#202020] border-t border-gray-100 dark:border-gray-800">
                                {group.status === 'pending' && (
                                    <div className="text-center py-2 text-yellow-600 font-bold bg-yellow-50 rounded-lg">
                                        ⏳ Chờ phục vụ duyệt
                                    </div>
                                )}
                                {group.status === 'preparing' && (
                                    <button 
                                        onClick={() => handleStatusChange(group, 'ready')}
                                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-lg">check_circle</span>
                                        Hoàn tất ({group.total_quantity})
                                    </button>
                                )}
                                {group.status === 'ready' && (
                                    <div className="text-center py-2 text-green-600 font-bold flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined">room_service</span>
                                        Đang chờ phục vụ
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}