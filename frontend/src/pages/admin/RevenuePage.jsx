import { useState, useEffect } from 'react';
import axios from 'axios';

const RevenuePage = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [range, setRange] = useState('week'); // today, week, month, year, all

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    const getAuthHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                // We send 'range' param now
                const res = await axios.get(`${API_URL}/api/revenue?range=${range}`, getAuthHeader());
                setStats(res.data.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch revenue stats');
                setLoading(false);
            }
        };

        fetchStats();
    }, [range]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    Revenue Statistics
                </h2>

                <div className="relative">
                    <select
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                        className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-gray-500 font-medium"
                    >
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="year">Last 1 Year</option>
                        <option value="all">All Time</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading data...</div>
            ) : error ? (
                <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 border-b font-semibold text-gray-600">Period</th>
                                <th className="p-4 border-b font-semibold text-gray-600 text-center">Orders</th>
                                <th className="p-4 border-b font-semibold text-gray-600 text-right">Total Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="p-6 text-center text-gray-500">No sales data found for this period.</td>
                                </tr>
                            ) : (
                                stats.map((row, index) => (
                                    <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 border-b border-gray-100 font-medium text-gray-800">
                                            {row.date}
                                        </td>
                                        <td className="p-4 border-b border-gray-100 text-center text-gray-600">
                                            {row.count}
                                        </td>
                                        <td className="p-4 border-b border-gray-100 text-right font-bold text-emerald-600 text-lg">
                                            {parseInt(row.total).toLocaleString()}đ
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default RevenuePage;
