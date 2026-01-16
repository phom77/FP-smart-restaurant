import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const StaffManagement = () => {
    const { t } = useTranslation();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'waiter',
        phone: ''
    });

    const [editData, setEditData] = useState({
        full_name: '',
        role: 'waiter',
        phone: '',
        password: ''
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    const getAuthHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/admin/staff`, getAuthHeader());
            setStaff(res.data.data);
        } catch (err) {
            console.error(err);
            toast.error(t('common.failed'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const validateStaffForm = (data) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!emailRegex.test(data.email)) {
            toast.error("Email không hợp lệ");
            return false;
        }
        // Chỉ validate password nếu đang tạo mới hoặc đang đổi password
        if (data.password && !passwordRegex.test(data.password)) {
            toast.error("Mật khẩu yếu! Cần 8+ ký tự, Hoa, Thường, Số, Ký tự đặc biệt.");
            return false;
        }
        return true;
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        if (!validateStaffForm(formData)) return;
        try {
            await axios.post(`${API_URL}/api/admin/staff`, formData, getAuthHeader());
            toast.success(t('staff.toast_created'));
            fetchStaff();
            setIsAddModalOpen(false);
            setFormData({ email: '', password: '', full_name: '', role: 'waiter', phone: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || t('common.failed'));
        }
    };

    const handleUpdateStaff = async (e) => {
        e.preventDefault();
        try {
            // Only send password if it's not empty
            const payload = { ...editData };
            if (!payload.password) delete payload.password;

            await axios.put(`${API_URL}/api/admin/staff/${selectedStaff.id}`, payload, getAuthHeader());
            toast.success(t('staff.toast_updated'));
            fetchStaff();
            setIsEditModalOpen(false);
        } catch (err) {
            toast.error(t('common.failed'));
        }
    };

    const handleDeleteStaff = async (id) => {
        if (!window.confirm(t('staff.confirm_delete'))) return;
        try {
            await axios.delete(`${API_URL}/api/admin/staff/${id}`, getAuthHeader());
            toast.success(t('staff.toast_deleted'));
            fetchStaff();
        } catch (err) {
            toast.error(t('common.failed'));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{t('staff.title')}</h2>
                    <p className="text-gray-500 text-sm">{t('staff.total_staff')}: {staff.length}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="flex bg-white p-1 rounded-xl border border-gray-200 w-full sm:w-auto">
                        <div className="relative flex-1 sm:min-w-[320px]">
                            <input
                                type="text"
                                placeholder={t('staff.search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-transparent border-none focus:ring-0 text-sm h-full"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                        </div>
                        <div className="w-[1px] bg-gray-200 my-1"></div>
                        <button
                            onClick={fetchStaff}
                            className="px-3 bg-white text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Refresh"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all shadow-emerald-100 whitespace-nowrap"
                    >
                        {t('staff.add_staff')}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider mb-1">{t('staff.total_staff')}</p>
                            <p className="text-2xl font-black text-gray-800">{staff.length}</p>
                        </div>
                        <div className="bg-emerald-50/30 p-4 rounded-2xl shadow-sm border border-emerald-50">
                            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-1">{t('staff.admins')}</p>
                            <p className="text-2xl font-black text-emerald-600">{staff.filter(s => s.role === 'admin').length}</p>
                        </div>
                        <div className="bg-blue-50/30 p-4 rounded-2xl shadow-sm border border-blue-50">
                            <p className="text-blue-400 text-[10px] font-black uppercase tracking-wider mb-1">{t('staff.waiters')}</p>
                            <p className="text-2xl font-black text-blue-600">{staff.filter(s => s.role === 'waiter').length}</p>
                        </div>
                        <div className="bg-orange-50/30 p-4 rounded-2xl shadow-sm border border-orange-50">
                            <p className="text-orange-400 text-[10px] font-black uppercase tracking-wider mb-1">{t('staff.kitchen_staff')}</p>
                            <p className="text-2xl font-black text-orange-600">{staff.filter(s => s.role === 'kitchen').length}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-6 py-4 font-bold text-gray-600 text-sm">{t('staff.name')}</th>
                                        <th className="px-6 py-4 font-bold text-gray-600 text-sm">{t('staff.email')}</th>
                                        <th className="px-6 py-4 font-bold text-gray-600 text-sm">{t('staff.role')}</th>
                                        <th className="px-6 py-4 font-bold text-gray-600 text-sm">{t('staff.phone')}</th>
                                        <th className="px-6 py-4 font-bold text-gray-600 text-sm text-center">{t('staff.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {staff.filter(s =>
                                        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        s.email.toLowerCase().includes(searchQuery.toLowerCase())
                                    ).map((s) => (
                                        <tr key={s.id} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xs">
                                                        {s.full_name.charAt(0)}
                                                    </div>
                                                    <span className="font-semibold text-gray-800">{s.full_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">{s.email}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${s.role === 'waiter' ? 'bg-blue-100 text-blue-700' :
                                                    s.role === 'kitchen' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    {s.role === 'admin' ? t('staff.role_admin') : s.role === 'kitchen' ? t('staff.role_kitchen') : t('staff.role_waiter')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">{s.phone || '-'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => { setSelectedStaff(s); setIsViewModalOpen(true); }}
                                                        className="bg-gray-50 text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                                        title={t('menu.view')}
                                                    >
                                                        {t('menu.view')}
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedStaff(s); setEditData({ full_name: s.full_name, role: s.role, phone: s.phone || '', password: '' }); setIsEditModalOpen(true); }}
                                                        className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                                                        title={t('staff.edit')}
                                                    >
                                                        {t('staff.edit')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStaff(s.id)}
                                                        className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                                                        title={t('staff.delete')}
                                                    >
                                                        {t('staff.delete')}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Modal Add Staff */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl scale-in-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('staff.modal_add_title')}</h2>
                        <form onSubmit={handleCreateStaff} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text" required
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('staff.email')}</label>
                                <input
                                    type="email" required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('staff.password')}</label>
                                <input
                                    type="password" required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="waiter">Waiter</option>
                                    <option value="kitchen">Kitchen Staff</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 hover:scale-105 transition-all"
                                >
                                    {t('staff.create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Edit Staff */}
            {isEditModalOpen && selectedStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl scale-in-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('staff.modal_edit_title')}</h2>
                        <form onSubmit={handleUpdateStaff} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text" required
                                    value={editData.full_name}
                                    onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                                <select
                                    value={editData.role}
                                    onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="waiter">Waiter</option>
                                    <option value="kitchen">Kitchen Staff</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={editData.phone}
                                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                <label className="block text-sm font-bold text-amber-800 mb-1">Reset Password (Optional)</label>
                                <input
                                    type="password"
                                    placeholder="Leave blank to keep current"
                                    value={editData.password}
                                    onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-500 outline-none bg-white font-medium"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg"
                                >
                                    {t('staff.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal View Staff Details */}
            {isViewModalOpen && selectedStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl scale-in-center">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Staff Details</h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-2xl">
                                    {selectedStaff.full_name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{selectedStaff.full_name}</h3>
                                    <p className="text-gray-500 text-sm font-medium">{selectedStaff.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1.5 mb-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        Role
                                    </p>
                                    <p className="text-sm font-bold text-emerald-600 uppercase mt-1">{selectedStaff.role}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1.5 mb-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        Phone
                                    </p>
                                    <p className="text-sm font-bold text-gray-800 mt-1">{selectedStaff.phone || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1.5 mb-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    Joined Date
                                </p>
                                <p className="text-sm text-gray-800 font-medium font-mono">
                                    {new Date(selectedStaff.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setIsViewModalOpen(false); setEditData({ full_name: selectedStaff.full_name, role: selectedStaff.role, phone: selectedStaff.phone || '', password: '' }); setIsEditModalOpen(true); }}
                                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg"
                            >
                                {t('staff.edit')}
                            </button>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                            >
                                {t('staff.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManagement;
