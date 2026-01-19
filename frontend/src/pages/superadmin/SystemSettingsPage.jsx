import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next'; // Import i18n

export default function SystemSettingsPage() {
    const { t } = useTranslation();
    const [settings, setSettings] = useState({
        restaurant_name: '',
        currency: '',
        vat_rate: '',
        wifi_password: '',
        open_time: '',
        close_time: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load settings khi vào trang
        const fetchSettings = async () => {
            try {
                const res = await api.get('/api/system/settings');
                if (res.data.success) {
                    setSettings(prev => ({ ...prev, ...res.data.data }));
                }
            } catch (err) {
                toast.error(t('superadmin.settings.error_load'));
            }
        };
        fetchSettings();
    }, [t]);

    const handleChange = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.put('/api/system/settings', settings);
            if (res.data.success) {
                toast.success(t('superadmin.settings.success_toast'));
            }
        } catch (err) {
            toast.error(t('superadmin.settings.error_toast'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="mb-8 border-b border-gray-100 pb-4">
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{t('superadmin.settings.title')}</h2>
                    <p className="text-gray-500 mt-1">{t('superadmin.settings.subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Thông tin cơ bản */}
                    <section>
                        <h3 className="text-lg font-bold text-emerald-600 mb-5 flex items-center gap-2">
                            <span className="p-2 bg-emerald-50 rounded-lg material-symbols-outlined text-xl">storefront</span>
                            {t('superadmin.settings.restaurant_info')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('superadmin.settings.restaurant_name')}</label>
                                <input
                                    name="restaurant_name"
                                    value={settings.restaurant_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('superadmin.settings.wifi')}</label>
                                <input
                                    name="wifi_password"
                                    value={settings.wifi_password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 font-medium"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Tài chính & Vận hành */}
                    <section>
                        <h3 className="text-lg font-bold text-emerald-600 mb-5 flex items-center gap-2">
                            <span className="p-2 bg-emerald-50 rounded-lg material-symbols-outlined text-xl">payments</span>
                            {t('superadmin.settings.finance')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('superadmin.settings.currency')}</label>
                                <input
                                    name="currency"
                                    value={settings.currency}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('superadmin.settings.vat')}</label>
                                <input
                                    name="vat_rate"
                                    type="number"
                                    value={settings.vat_rate}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 font-medium"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('superadmin.settings.open_time')}</label>
                                <input
                                    name="open_time"
                                    type="time"
                                    value={settings.open_time}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all cursor-pointer font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('superadmin.settings.close_time')}</label>
                                <input
                                    name="close_time"
                                    type="time"
                                    value={settings.close_time}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all cursor-pointer font-medium"
                                />
                            </div>
                        </div>
                    </section>

                    <div className="pt-8 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center gap-2"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <span className="material-symbols-outlined">save</span>
                            )}
                            {loading ? t('superadmin.settings.loading_btn') : t('superadmin.settings.save_btn')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}