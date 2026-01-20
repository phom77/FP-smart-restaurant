import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next'; // Import i18n

export default function UserManagementPage() {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = { page, limit };
            if (filter !== 'all') {
                params.role = filter;
            }
            if (searchTerm) {
                params.search = searchTerm;
            }

            const res = await api.get('/api/super-admin/users', { params });
            if (res.data.success) {
                setUsers(res.data.data);
                if (res.data.pagination) {
                    setTotalPages(res.data.pagination.totalPages);
                }
            }
        } catch (err) {
            toast.error(t('superadmin.user.load_error'));
        } finally {
            setLoading(false);
        }
    };

    // Reset pagination when filter or search changes
    useEffect(() => {
        setPage(1);
    }, [filter, searchTerm]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 500);

        return () => clearTimeout(timer);
    }, [filter, page, searchTerm]);

    const handleToggleStatus = async (id, currentStatus) => {
        const action = currentStatus ? t('superadmin.user.action_ban') : t('superadmin.user.action_unban');
        if (!window.confirm(t('superadmin.user.toggle_confirm', { action }))) return;

        try {
            await api.patch(`/api/super-admin/users/${id}/status`, { is_active: !currentStatus });
            toast.success(t('superadmin.user.update_success'));
            fetchUsers();
        } catch (err) {
            toast.error(t('superadmin.user.update_error'));
        }
    };

    const getRoleBadge = (role) => {
        const colors = {
            super_admin: 'bg-purple-100 text-purple-800',
            admin: 'bg-red-100 text-red-800',
            waiter: 'bg-blue-100 text-blue-800',
            kitchen: 'bg-orange-100 text-orange-800',
            customer: 'bg-green-100 text-green-800',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[role] || 'bg-gray-100'}`}>
                {t(`superadmin.user.roles.${role}`)}
            </span>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-lg font-bold text-gray-800">{t('superadmin.user.title')}</h2>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Search Input */}
                    <div className="relative flex-1 md:w-96">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder={t('superadmin.user.search_placeholder')}
                            className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Role Filter */}
                    <select
                        className="h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-emerald-500 bg-white"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">{t('superadmin.user.filter_all')}</option>
                        <option value="admin">{t('superadmin.user.filter_admin')}</option>
                        <option value="waiter">{t('superadmin.user.filter_waiter')}</option>
                        <option value="kitchen">{t('superadmin.user.filter_kitchen') || 'Kitchen'}</option>
                        <option value="customer">{t('superadmin.user.filter_customer')}</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">{t('superadmin.user.col_info')}</th>
                            <th className="px-6 py-4">{t('superadmin.user.col_role')}</th>
                            <th className="px-6 py-4">{t('superadmin.user.col_date')}</th>
                            <th className="px-6 py-4">{t('superadmin.user.col_status')}</th>
                            <th className="px-6 py-4 text-right">{t('superadmin.user.col_action')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">{t('common.loading')}</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">{t('superadmin.user.no_data')}</td></tr>
                        ) : users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4">
                                    <p className="font-medium text-gray-900">{user.full_name}</p>
                                    <p className="text-gray-500 text-xs">{user.email}</p>
                                    <p className="text-gray-400 text-xs">{user.phone || '---'}</p>
                                </td>
                                <td className="px-6 py-4">
                                    {getRoleBadge(user.role)}
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    {new Date(user.created_at).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="px-6 py-4">
                                    {user.is_verified ? (
                                        <span className="text-green-600 flex items-center gap-1 text-xs font-bold">
                                            <span className="w-2 h-2 rounded-full bg-green-600"></span> {t('superadmin.user.status_active')}
                                        </span>
                                    ) : (
                                        <span className="text-red-500 flex items-center gap-1 text-xs font-bold">
                                            <span className="w-2 h-2 rounded-full bg-red-500"></span> {t('superadmin.user.status_banned')}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {user.role !== 'super_admin' && (
                                        <button
                                            onClick={() => handleToggleStatus(user.id, user.is_verified)}
                                            className={`px-3 py-1.5 rounded text-xs font-medium transition ${user.is_verified
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                }`}
                                        >
                                            {user.is_verified ? t('superadmin.user.action_ban') : t('superadmin.user.action_unban')}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                <p className="text-sm text-gray-500">
                    {t('common.showing_page', { page, total: totalPages })}
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:hover:shadow-none transition-all"
                    >
                        {t('common.prev')}
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:hover:shadow-none transition-all"
                    >
                        {t('common.next')}
                    </button>
                </div>
            </div>
        </div>
    );
}