import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const TableMapPage = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    const fetchTables = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/tables`);
            setTables(res.data.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();

        // Socket for real-time table status updates
        const newSocket = io(API_URL);

        newSocket.on('connect', () => {
            newSocket.emit('join_room', 'waiter'); // Listen to waiter room or global updates
        });

        // Assuming backend might emit this evt, or we infer from order updates
        // For now, let's just re-fetch on generic update or timer
        // ideally: newSocket.on('table_updated', fetchTables);

        const interval = setInterval(fetchTables, 10000); // Polling as backup

        return () => {
            newSocket.close();
            clearInterval(interval);
        };
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'available': return 'bg-green-100 border-green-300 text-green-800';
            case 'occupied': return 'bg-red-100 border-red-300 text-red-800';
            case 'reserved': return 'bg-amber-100 border-amber-300 text-amber-800';
            case 'dirty': return 'bg-gray-200 border-gray-400 text-gray-800'; // If we had this status
            default: return 'bg-gray-100 border-gray-200 text-gray-600';
        }
    };

    if (loading) return <div>Loading map...</div>;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg h-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Table Map</h2>
                    <p className="text-gray-500 mt-1">Live overview of restaurant tables</p>
                </div>
                <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    Live Updates
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
                        <span className="text-sm font-medium uppercase mt-2 tracking-wider">{table.status}</span>

                        <div className="mt-2 text-xs opacity-70">
                            Capacity: {table.capacity}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex gap-4 text-sm justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                    <span>Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-amber-100 border-amber-300 rounded"></div>
                    <span>Reserved</span>
                </div>
            </div>
        </div>
    );
};

export default TableMapPage;
