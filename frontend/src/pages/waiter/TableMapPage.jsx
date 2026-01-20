import { useState, useEffect } from 'react';
import api from '../../services/api';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';

const TableMapPage = () => {
    const { t } = useTranslation();
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 20;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    const fetchTables = async (page = currentPage) => {
        try {
            const res = await api.get(`/api/admin/tables?page=${page}&limit=${itemsPerPage}`);
            setTables(res.data.data);
            setTotalPages(res.data.pagination?.totalPages || 1);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTables(currentPage);

        const newSocket = io(API_URL, {
            auth: {
                token: localStorage.getItem('token')
            }
        });

        newSocket.on('connect', () => {
            newSocket.emit('join_room', 'waiter');
        });

        newSocket.on('new_order', () => fetchTables(currentPage));
        newSocket.on('order_status_updated', () => fetchTables(currentPage));
        newSocket.on('item_status_update', () => fetchTables(currentPage));

        // Listen for table updates (active/deactive)
        newSocket.on('table_updated', (updatedTable) => {
            setTables(prevTables =>
                prevTables.map(table =>
                    table.id === updatedTable.id
                        ? { ...table, ...updatedTable }
                        : table
                )
            );
        });

        const interval = setInterval(() => fetchTables(currentPage), 30000);

        return () => {
            newSocket.close();
            clearInterval(interval);
        };
    }, [currentPage]);

    const getStatusColor = (status, isActive) => {
        // If table is inactive, show it as disabled
        if (!isActive) {
            return 'bg-gray-100 border-gray-300 text-gray-500 opacity-50 cursor-not-allowed';
        }

        switch (status) {
            case 'available': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
            case 'occupied': return 'bg-rose-50 border-rose-200 text-rose-700';
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
        <div className="bg-white p-6 rounded-2xl shadow-lg min-h-[85vh]">
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
                            ${getStatusColor(table.status, table.is_active)}
                        `}
                    >
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        <span className="text-3xl font-bold">{table.table_number}</span>
                        <span className="text-sm font-medium uppercase mt-2 tracking-wider">
                            {!table.is_active ? (
                                <span className="text-red-500">• {t('table.status_inactive')}</span>
                            ) : (
                                t(`waiter.status.${table.status}`)
                            )}
                        </span>

                        <div className="mt-2 text-[10px] opacity-70 font-bold uppercase">
                            {t('waiter.capacity')}: {table.capacity}
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                    <button
                        onClick={() => {
                            if (currentPage > 1) {
                                setCurrentPage(prev => prev - 1);
                            }
                        }}
                        disabled={currentPage === 1}
                        className={`p-3 rounded-xl border-2 transition-all ${currentPage === 1 ? 'border-gray-100 text-gray-300' : 'border-gray-200 text-gray-600 hover:border-emerald-500 hover:text-emerald-500 active:scale-95'}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>

                    <span className="text-gray-500 font-medium">
                        {t('common.page_of', { current: currentPage, total: totalPages })}
                    </span>

                    <button
                        onClick={() => {
                            if (currentPage < totalPages) {
                                setCurrentPage(prev => prev + 1);
                            }
                        }}
                        disabled={currentPage === totalPages}
                        className={`p-3 rounded-xl border-2 transition-all ${currentPage === totalPages ? 'border-gray-100 text-gray-300' : 'border-gray-200 text-gray-600 hover:border-emerald-500 hover:text-emerald-500 active:scale-95'}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default TableMapPage;
