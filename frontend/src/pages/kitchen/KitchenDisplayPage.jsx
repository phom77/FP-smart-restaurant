import { useState, useEffect, useMemo } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next'; // Import i18n

export default function KitchenDisplayPage() {
    const { t, i18n } = useTranslation(); // Init i18n
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSummary, setShowSummary] = useState(false);
    const socket = useSocket();
    const { logout } = useAuth();
    const navigate = useNavigate();

    // Toggle Language
    const toggleLanguage = () => {
        const newLang = i18n.language === 'vi' ? 'en' : 'vi';
        i18n.changeLanguage(newLang);
    };

    // ========== 1. FETCH DỮ LIỆU ==========
    const fetchKitchenOrders = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/kitchen/items');
            if (res.data.success) {
                setOrders(res.data.data);
                if (!loading) toast.success(t('kitchen.refresh_toast'));
            }
        } catch (err) {
            console.error("❌ Lỗi tải đơn bếp:", err);
            toast.error(t('kitchen.error_toast'));
        } finally {
            setLoading(false);
        }
    };

    // Chỉ chạy lần đầu
    useEffect(() => {
        const initFetch = async () => {
            try {
                const res = await api.get('/api/kitchen/items');
                if (res.data.success) {
                    setOrders(res.data.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        initFetch();
    }, []);

    // ========== 2. SOCKET REALTIME ==========
    useEffect(() => {
        if (!socket) return;

        console.log("👨‍🍳 Bếp đang join room 'kitchen'...");
        socket.emit('join_room', 'kitchen');

        // ✅ A. Khi Waiter duyệt đơn (pending → processing)
        const handleNewOrder = (data) => {
            console.log("🔔 Bếp nhận đơn mới:", data);

            try {
                const audio = new Audio('/notification.mp3');
                audio.play().catch(() => { });
            } catch (e) { }

            toast.success(t('kitchen.new_order_toast', { table: data.table_number || data.table_id }));

            api.get('/api/kitchen/items').then(res => {
                if (res.data.success) setOrders(res.data.data);
            });
        };

        // ✅ B. Khi đồng đội update 1 món (preparing → ready)
        const handleItemUpdate = (data) => {
            console.log("🔄 Kitchen item update:", data);

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
    }, [socket, t]); // Add t to deps

    // ========== 3. XỬ LÝ CẬP NHẬT STATUS ==========
    const handleUpdateItem = async (itemId, newStatus) => {
        try {
            setOrders(prev => prev.map(order => ({
                ...order,
                order_items: order.order_items.map(item =>
                    item.id === itemId ? { ...item, status: newStatus } : item
                )
            })));

            await api.put(`/api/kitchen/items/${itemId}`, { status: newStatus });
            toast.success(t('kitchen.update_success'));

        } catch (err) {
            console.error("❌ Lỗi cập nhật:", err);
            toast.error(t('kitchen.update_error'));
            fetchKitchenOrders();
        }
    };

    // Xử lý Logout
    const handleLogout = () => {
        if (window.confirm(t('common.logout_confirm'))) {
            logout();
            navigate('/login');
        }
    };

    // ========== 4. TỔNG HỢP THEO MÓN (CHO MODAL) ==========
    const summaryData = useMemo(() => {
        const summary = {};

        orders.forEach(order => {
            order.order_items.forEach(item => {
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
        if (diff < 1) return t('kitchen.new');
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
            pending: { bg: 'bg-gray-100', text: 'text-gray-600', label: t('kitchen.status_pending') },
            preparing: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: t('kitchen.status_preparing') },
            ready: { bg: 'bg-green-100', text: 'text-green-700', label: t('kitchen.status_ready') },
        };
        return badges[status] || badges.pending;
    };

    // ========== 6. RENDER ==========
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-20 md:p-6 md:pb-24">
            {/* ========== HEADER ========== */}
            <header className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent flex items-center gap-2">
                        <span className="material-symbols-outlined text-3xl text-emerald-600">soup_kitchen</span> {t('kitchen.title')}
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">
                        {t('kitchen.subtitle', { count: orders.length })}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowSummary(true)}
                        className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-5 py-3 rounded-2xl font-bold hover:bg-emerald-100 transition-all active:scale-95 border border-emerald-100"
                    >
                        <span className="material-symbols-outlined text-xl">analytics</span>
                        {t('kitchen.summary_btn')} ({summaryData.reduce((acc, [_, v]) => acc + v.count, 0)})
                    </button>
                </div>
            </header>

            {/* ========== ORDERS GRID ========== */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {orders.map(order => {
                    const allReady = order.order_items.every(item => item.status === 'ready');

                    return (
                        <div
                            key={order.id}
                            className={`bg-white rounded-3xl shadow-sm border overflow-hidden flex flex-col transition-all hover:shadow-md ${allReady ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-gray-100'
                                }`}
                        >
                            {/* Order Header */}
                            <div className={`${getHeaderColor(order.created_at)} text-white p-4 flex justify-between items-center bg-gradient-to-r from-opacity-90 to-opacity-100`}>
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">table_restaurant</span>
                                        {t('kitchen.table')} {order.tables?.table_number}
                                    </h3>
                                    <p className="text-xs opacity-90 font-mono mt-0.5">#{order.id.slice(0, 8)}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold font-mono tracking-tight">{getElapsedTime(order.created_at)}</div>
                                    {allReady && (
                                        <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium mt-1">
                                            <span className="material-symbols-outlined text-[14px]">check</span> {t('kitchen.all_done')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="p-4 flex-1 space-y-4">
                                {order.order_items.map(item => {
                                    const badge = getStatusBadge(item.status);

                                    return (
                                        <div key={item.id} className="relative pl-3">
                                            {/* Left color bar indicator */}
                                            <div className={`absolute left-0 top-1 bottom-1 w-1 rounded-full ${item.status === 'ready' ? 'bg-emerald-500' : item.status === 'preparing' ? 'bg-yellow-400' : 'bg-gray-200'}`}></div>

                                            {/* Item Info */}
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-baseline gap-2 mb-1">
                                                        <span className="font-bold text-lg text-gray-800 tabular-nums">
                                                            {item.quantity}x
                                                        </span>
                                                        <span className="font-semibold text-gray-800 leading-tight">
                                                            {item.menu_items?.name}
                                                        </span>
                                                    </div>

                                                    {/* Modifiers */}
                                                    {item.order_item_modifiers?.length > 0 && (
                                                        <p className="text-xs text-gray-500 mb-1 leading-relaxed">
                                                            + {item.order_item_modifiers.map(m => m.modifier_name).join(', ')}
                                                        </p>
                                                    )}

                                                    {/* Notes */}
                                                    {item.notes && (
                                                        <p className="inline-flex items-center gap-1 text-xs text-red-600 font-bold bg-red-50 px-2 py-1 rounded-lg mt-1 border border-red-100">
                                                            <span className="material-symbols-outlined text-[14px]">edit_note</span> {item.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2">
                                                {item.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleUpdateItem(item.id, 'preparing')}
                                                        className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
                                                    >
                                                        {t('kitchen.action_start')}
                                                    </button>
                                                )}

                                                {item.status === 'preparing' && (
                                                    <button
                                                        onClick={() => handleUpdateItem(item.id, 'ready')}
                                                        className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-sm transition-all active:scale-95 shadow-emerald-200"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">check</span> {t('kitchen.action_complete')}
                                                    </button>
                                                )}

                                                {item.status === 'ready' && (
                                                    <div className="flex-1 text-center text-emerald-600 font-bold text-sm py-2 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center gap-1">
                                                        <span className="material-symbols-outlined text-base">check_circle</span>
                                                        {t('kitchen.action_done')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Order Footer */}
                            <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100">
                                <div className="text-xs text-gray-400 font-medium text-center flex items-center justify-center gap-1">
                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                    {new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Empty State */}
                {orders.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center min-h-[85vh] py-24 text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-4xl text-gray-300">soup_kitchen</span>
                        </div>
                        <p className="text-xl font-bold text-gray-600">{t('kitchen.empty_title')}</p>
                        <p className="text-sm text-gray-400 mt-2">{t('kitchen.empty_desc')}</p>
                    </div>
                )}
            </div>

            {/* ========== FLOATING ACTION BUTTONS (Góc dưới trái) ========== */}
            <div className="fixed bottom-8 left-8 flex flex-col gap-4 z-40">
                <button
                    onClick={toggleLanguage}
                    className="w-12 h-12 bg-white text-emerald-600 rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 hover:scale-105 transition-all group"
                    title={t('kitchen.language_tooltip') || 'Change Language'}
                >
                    <span className="material-symbols-outlined text-xl">language</span>
                </button>

                <button
                    onClick={fetchKitchenOrders}
                    className="w-12 h-12 bg-white text-emerald-600 rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center hover:bg-emerald-50 hover:scale-105 transition-all group"
                    title={t('kitchen.refresh_tooltip')}
                >
                    <span className={`material-symbols-outlined text-xl ${loading ? 'animate-spin' : ''}`}>refresh</span>
                </button>

                <button
                    onClick={handleLogout}
                    className="w-12 h-12 bg-white text-red-500 rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center hover:bg-red-50 hover:scale-105 transition-all group"
                    title={t('kitchen.logout_tooltip')}
                >
                    <span className="material-symbols-outlined text-xl">logout</span>
                </button>
            </div>

            {/* ========== SUMMARY MODAL ========== */}
            {showSummary && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <span className="p-2 bg-emerald-50 rounded-lg text-emerald-600 material-symbols-outlined">analytics</span>
                                    {t('kitchen.modal_title')}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1 pl-12">
                                    {t('kitchen.modal_total', { count: summaryData.reduce((acc, [_, v]) => acc + v.count, 0) })}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowSummary(false)}
                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1">
                            <table className="w-full">
                                <thead className="text-gray-500 text-xs uppercase font-bold tracking-wider bg-gray-50 sticky top-0 rounded-lg">
                                    <tr>
                                        <th className="px-4 py-3 text-left first:rounded-l-lg">{t('kitchen.col_item')}</th>
                                        <th className="px-4 py-3 text-center">{t('kitchen.col_pending')}</th>
                                        <th className="px-4 py-3 text-center">{t('kitchen.col_preparing')}</th>
                                        <th className="px-4 py-3 text-right last:rounded-r-lg">{t('kitchen.col_total')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {summaryData.map(([name, data]) => (
                                        <tr key={name} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-4 font-medium text-gray-800">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                                    {name}
                                                </div>
                                                {data.notes.length > 0 && (
                                                    <div className="text-xs text-red-500 font-medium mt-1.5 ml-4.5 bg-red-50 inline-block px-2 py-0.5 rounded border border-red-100">
                                                        Note: {data.notes.length}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${data.pending > 0 ? 'bg-gray-100 text-gray-600' : 'text-gray-300'}`}>
                                                    {data.pending}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${data.preparing > 0 ? 'bg-yellow-50 text-yellow-700' : 'text-gray-300'}`}>
                                                    {data.preparing}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="font-bold text-lg text-emerald-600">
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