import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, Cell,
    AreaChart, Area
} from 'recharts';

const DashboardPage = () => {
    const { t, i18n } = useTranslation();
    const [stats, setStats] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [peakHours, setPeakHours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [range, setRange] = useState('week'); // today, week, month, year, all, custom

    // Helper to get local date string YYYY-MM-DD
    const getLocalDateString = (date = new Date()) => {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

    const [customStart, setCustomStart] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return getLocalDateString(d);
    });

    const [customEnd, setCustomEnd] = useState(getLocalDateString());

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    const getAuthHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    useEffect(() => {
        const fetchAllStats = async () => {
            setLoading(true);
            try {
                let url = `${API_URL}/api/analytics/revenue?range=${range}`;
                let topUrl = `${API_URL}/api/analytics/top-products?limit=10`;
                let peakUrl = `${API_URL}/api/analytics/peak-hours`;

                if (range === 'custom') {
                    url += `&from=${customStart}&to=${customEnd}`;
                    topUrl += `&start_date=${customStart}&end_date=${customEnd}`;
                    peakUrl += `?start_date=${customStart}&end_date=${customEnd}`;
                }

                const [revenueRes, topRes, peakRes] = await Promise.all([
                    axios.get(url, getAuthHeader()),
                    axios.get(topUrl, getAuthHeader()),
                    axios.get(peakUrl, getAuthHeader())
                ]);

                setStats(revenueRes.data.data);
                setTopProducts(topRes.data.data);
                setPeakHours(peakRes.data.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError(t('common.failed'));
                setLoading(false);
            }
        };

        fetchAllStats();
    }, [range, customStart, customEnd, t, API_URL]);

    const handleExport = async () => {
        try {
            let exportUrl = `${API_URL}/api/analytics/export?range=${range}`;
            if (range === 'custom') {
                exportUrl += `&from=${customStart}&to=${customEnd}`;
            }

            const response = await axios({
                url: exportUrl,
                method: 'GET',
                responseType: 'blob',
                ...getAuthHeader()
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `revenue_report_${range}.xlsx`);
            document.body.appendChild(link);
            link.click();
        } catch {
            console.error('Export failed');
        }
    };


    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {t('revenue.title')}
                    </h2>
                    <p className="text-gray-500 mt-1">{t('revenue.subtitle')}</p>

                </div>

                <div className="flex flex-wrap items-center gap-3">

                    <button
                        onClick={handleExport}
                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        {t('common.export')}
                    </button>

                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                        {range === 'custom' && (
                            <div className="flex items-center gap-2 px-2 border-r border-gray-200 mr-2 animate-in fade-in slide-in-from-left-2 transition-all">
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] uppercase font-bold text-gray-400">{t('revenue.from')}</span>
                                    <input
                                        type="date"
                                        value={customStart}
                                        max={getLocalDateString()}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 p-0 cursor-pointer"
                                    />
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] uppercase font-bold text-gray-400">{t('revenue.to')}</span>
                                    <input
                                        type="date"
                                        value={customEnd}
                                        max={getLocalDateString()}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 p-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="relative">
                            <select
                                value={range}
                                onChange={(e) => setRange(e.target.value)}
                                className="appearance-none bg-transparent text-gray-700 py-1 px-4 pr-10 rounded-lg font-bold focus:outline-none transition-all cursor-pointer min-w-[140px]"
                            >
                                <option value="today">{t('revenue.today')}</option>
                                <option value="week">{t('revenue.week')}</option>
                                <option value="month">{t('revenue.month')}</option>
                                <option value="year">{t('revenue.year')}</option>
                                <option value="all">{t('revenue.all')}</option>
                                <option value="custom">{t('revenue.custom')}</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-500 font-medium">{t('common.loading')}</p>
                </div>
            ) : error ? (
                <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-100 font-medium flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Line Chart */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                            {t('revenue.chart_title')}
                        </h3>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        dx={-5}
                                        width={80}
                                        tickFormatter={(value) => {
                                            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                                            if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
                                            return value;
                                        }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(val) => [parseInt(val).toLocaleString() + 'đ', t('common.revenue')]}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Products Bar Chart */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                            {t('revenue.top_products')}
                        </h3>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topProducts} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 500 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(val) => [val, 'Quantity']}
                                    />
                                    <Bar dataKey="total_quantity" radius={[0, 10, 10, 0]} barSize={20}>
                                        {topProducts.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Peak Hours Line Chart */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                            {t('revenue.peak_hours')}
                        </h3>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={peakHours}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tickFormatter={(hour) => `${hour}h`} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line type="step" dataKey="order_count" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="pb-4 font-bold text-gray-600 uppercase text-xs tracking-wider">{t('common.period')}</th>
                                        <th className="pb-4 font-bold text-gray-600 uppercase text-xs tracking-wider text-center">{t('common.orders')}</th>
                                        <th className="pb-4 font-bold text-gray-600 uppercase text-xs tracking-wider text-right">{t('common.revenue')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {stats.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="py-10 text-center text-gray-400 font-medium">{t('common.no_data')}</td>
                                        </tr>
                                    ) : (
                                        stats.map((row, index) => (
                                            <tr key={index} className="group hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 font-semibold text-gray-700">
                                                    {row.date}
                                                </td>
                                                <td className="py-4 text-center text-gray-500 font-medium">
                                                    {row.count}
                                                </td>
                                                <td className="py-4 text-right">
                                                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-bold">
                                                        {parseInt(row.total).toLocaleString()}đ
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
