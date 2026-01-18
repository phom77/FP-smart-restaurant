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
        restaurant_name: 'Smart Restaurant'
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-800">{t('superadmin.create_admin.title')}</h2>
                    <p className="text-sm text-gray-500">{t('superadmin.create_admin.subtitle')}</p>
                </div>

                {message.content && (
                    <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {message.content}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('superadmin.create_admin.owner_name')}</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('superadmin.create_admin.phone')}</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('superadmin.create_admin.email')}</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('superadmin.create_admin.password')}</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                                placeholder={t('superadmin.create_admin.password_hint')}
                                title={t('superadmin.create_admin.error_password')} // Use the error message as title tooltip
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('superadmin.create_admin.restaurant_name')}</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={formData.restaurant_name}
                            onChange={e => setFormData({ ...formData, restaurant_name: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm disabled:bg-gray-400"
                        >
                            {loading ? t('superadmin.create_admin.loading_btn') : t('superadmin.create_admin.submit_btn')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}