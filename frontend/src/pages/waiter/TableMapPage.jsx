import { useState, useEffect } from 'react';
import api from '../../services/api';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';

const TableMapPage = () => {
    const { t } = useTranslation();
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    const fetchTables = async () => {
        try {
            const res = await api.get('/api/admin/tables');
            setTables(res.data.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();

        const newSocket = io(API_URL, {
            auth: {
                token: localStorage.getItem('token')
            }
        });

        newSocket.on('connect', () => {
            newSocket.emit('join_room', 'waiter');
        });

        newSocket.on('new_order', fetchTables);
        newSocket.on('order_status_updated', fetchTables);
        newSocket.on('item_status_update', fetchTables);

        const interval = setInterval(fetchTables, 30000);

        return () => {
            newSocket.close();
            clearInterval(interval);
        };
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'available': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
            case 'occupied': return 'bg-rose-50 border-rose-200 text-rose-700';
            case 'reserved': return 'bg-amber-50 border-amber-200 text-amber-700';
            case 'dirty': return 'bg-gray-100 border-gray-300 text-gray-700';
            default: return 'bg-gray-50 border-gray-200 text-gray-600';
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            <span className="ml-3 text-gray-500">{t('waiter.loading_map')}</span>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg h-full">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">{t('waiter.table_map')}</h2>
                    <p className="text-gray-500 mt-1">{t('waiter.live_map')}</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 shadow-sm animate-pulse">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <span className="text-xs font-bold uppercase tracking-wider">{t('waiter.live_updates')}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {tables.map(table => (
                    <div
                        key={table.id}
                        className={`
                            h-32 rounded-2xl flex flex-col items-center justify-center border-2 shadow-sm transition-all relative overflow-hidden group
                            ${getStatusColor(table.status)}
                        `}
                    >
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        <span className="text-3xl font-bold">{table.table_number}</span>
                        <span className="text-sm font-medium uppercase mt-2 tracking-wider">
                            {t(`waiter.status.${table.status}`)}
                        </span>

                        <div className="mt-2 text-[10px] opacity-70 font-bold uppercase">
                            {t('waiter.capacity')}: {table.capacity}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 flex flex-wrap gap-6 text-sm justify-center border-t border-gray-50 pt-8">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-50 border border-emerald-200 rounded shadow-sm"></div>
                    <span className="font-medium text-gray-600">{t('waiter.status.available')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-rose-50 border border-rose-200 rounded shadow-sm"></div>
                    <span className="font-medium text-gray-600">{t('waiter.status.occupied')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-amber-50 border border-amber-200 rounded shadow-sm"></div>
                    <span className="font-medium text-gray-600">{t('waiter.status.reserved')}</span>
                </div>
            </div>
        </div>
    );
};

export default TableMapPage;
