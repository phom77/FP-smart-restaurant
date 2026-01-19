import { useState } from 'react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next'; // Import i18n

export default function CreateAdminPage() {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        restaurant_name: t('common.appName')
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });

    const validateForm = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // Password: 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!emailRegex.test(formData.email)) {
            setMessage({ type: 'error', content: t('superadmin.create_admin.error_email') });
            return false;
        }
        if (!passwordRegex.test(formData.password)) {
            setMessage({ type: 'error', content: t('superadmin.create_admin.error_password') });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        setMessage({ type: '', content: '' });

        try {
            const res = await api.post('/api/super-admin/create-admin', formData);
            if (res.data.success) {
                setMessage({ type: 'success', content: t('superadmin.create_admin.success_msg') });
                setFormData({ full_name: '', email: '', phone: '', password: '', restaurant_name: '' });
            }
        } catch (err) {
            setMessage({ type: 'error', content: err.response?.data?.message || t('common.failed') });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="mb-8 border-b border-gray-100 pb-4">
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{t('superadmin.create_admin.title')}</h2>
                    <p className="text-gray-500 mt-1">{t('superadmin.create_admin.subtitle')}</p>
                </div>

                {message.content && (
                    <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
                        <span className="material-symbols-outlined text-xl mt-0.5">
                            {message.type === 'success' ? 'check_circle' : 'error'}
                        </span>
                        <span>{message.content}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('superadmin.create_admin.owner_name')}</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 font-medium"
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('superadmin.create_admin.phone')}</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 font-medium"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('superadmin.create_admin.email')}</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 font-medium"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('superadmin.create_admin.password')}</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none font-mono text-sm transition-all placeholder-gray-400"
                                placeholder={t('superadmin.create_admin.password_hint')}
                                title={t('superadmin.create_admin.error_password')} // Use the error message as title tooltip
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t('superadmin.create_admin.restaurant_name')}</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 font-medium"
                            value={formData.restaurant_name}
                            onChange={e => setFormData({ ...formData, restaurant_name: e.target.value })}
                        />
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center gap-2"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <span className="material-symbols-outlined">person_add</span>
                            )}
                            {loading ? t('superadmin.create_admin.loading_btn') : t('superadmin.create_admin.submit_btn')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}