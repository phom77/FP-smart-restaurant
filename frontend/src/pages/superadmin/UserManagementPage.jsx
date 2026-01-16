import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const endpoint = filter === 'all' 
                ? '/api/super-admin/users' 
                : `/api/super-admin/users?role=${filter}`;
            
            const res = await api.get(endpoint);
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (err) {
            toast.error('Lỗi tải danh sách users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filter]);

    const handleToggleStatus = async (id, currentStatus) => {
        if (!window.confirm(`Bạn có chắc muốn ${currentStatus ? 'KHÓA' : 'MỞ KHÓA'} tài khoản này?`)) return;

        try {
            // Lưu ý: Backend đang dùng is_verified làm cờ check active. 
            // Nếu bạn đã thêm cột is_active riêng thì sửa lại logic này nhé.
            await api.patch(`/api/super-admin/users/${id}/status`, { is_active: !currentStatus });
            toast.success('Cập nhật trạng thái thành công');
            fetchUsers(); // Reload list
        } catch (err) {
            toast.error('Lỗi cập nhật trạng thái');
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
                {role.toUpperCase().replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Quản lý Tài khoản</h2>
                <select 
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="all">Tất cả vai trò</option>
                    <option value="admin">Admin (Chủ quán)</option>
                    <option value="waiter">Waiter</option>
                    <option value="customer">Customer</option>
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">User Info</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Ngày tạo</th>
                            <th className="px-6 py-4">Trạng thái</th>
                            <th className="px-6 py-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
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
                                            <span className="w-2 h-2 rounded-full bg-green-600"></span> Active
                                        </span>
                                    ) : (
                                        <span className="text-red-500 flex items-center gap-1 text-xs font-bold">
                                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Banned/Unverified
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {user.role !== 'super_admin' && (
                                        <button
                                            onClick={() => handleToggleStatus(user.id, user.is_verified)}
                                            className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                                                user.is_verified 
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                                            }`}
                                        >
                                            {user.is_verified ? 'Khóa (Ban)' : 'Mở khóa'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}