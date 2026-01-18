import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ProfilePage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Profile form state
    const [profileData, setProfileData] = useState({
        full_name: '',
        phone: '',
        avatar_url: ''
    });

    // Password form state
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.get(`${API_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setUser(response.data.user);
                setProfileData({
                    full_name: response.data.user.full_name || '',
                    phone: response.data.user.phone || '',
                    avatar_url: response.data.user.avatar_url || ''
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_URL}/api/users/profile`,
                profileData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setMessage({ type: 'success', text: t('customer.profile.update_success') });
                setUser(response.data.user);
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || t('customer.profile.update_error')
            });
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        // Validate passwords match
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: t('customer.profile.password_mismatch') });
            return;
        }

        // Validate password length
        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: t('customer.profile.password_length') });
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_URL}/api/users/password`,
                {
                    oldPassword: passwordData.oldPassword,
                    newPassword: passwordData.newPassword
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setMessage({ type: 'success', text: t('customer.profile.password_success') });
                setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || t('customer.profile.password_error')
            });
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // For now, we'll use a placeholder. In production, upload to storage service
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfileData({ ...profileData, avatar_url: reader.result });
        };
        reader.readAsDataURL(file);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
                <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
                    {/* Header with Back Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{t('customer.profile.title')}</h1>
                        <button
                            onClick={() => navigate('/menu')}
                            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-md hover:shadow-lg border border-gray-200 text-sm sm:text-base active:scale-95"
                        >
                            <span>{t('customer.orders.back_to_menu')}</span>
                        </button>
                    </div>

                    {/* Message Alert */}
                    {message.text && (
                        <div
                            className={`p-3 sm:p-4 rounded-lg text-sm sm:text-base ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}
                        >
                            {message.text}
                        </div>
                    )}

                    {/* Profile Information Section */}
                    <div className="space-y-4 sm:space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white shadow rounded-lg sm:rounded-xl p-4 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{t('customer.profile.account_info')}</h2>
                            <form onSubmit={handleProfileUpdate}>
                                {/* Avatar */}
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-4 sm:mb-6">
                                    <div className="relative">
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg">
                                            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                                        </div>
                                        <label
                                            htmlFor="avatar-upload"
                                            className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 sm:p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-md"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-3 w-3 sm:h-4 sm:w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                                />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </label>
                                        <input
                                            id="avatar-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            className="hidden"
                                        />
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <p className="text-xs sm:text-sm text-gray-600">Email</p>
                                        <p className="font-medium text-sm sm:text-base">{user?.email}</p>
                                        <p className="text-xs sm:text-sm text-gray-600 mt-1">{t('customer.profile.role')}: {user?.role}</p>
                                    </div>
                                </div>

                                {/* Full Name */}
                                <div className="mb-3 sm:mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">{t('customer.profile.fullname')}</label>
                                    <input
                                        type="text"
                                        value={profileData.full_name}
                                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                    />
                                </div>

                                {/* Phone */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">{t('customer.profile.phone')}</label>
                                    <input
                                        type="tel"
                                        value={profileData.phone}
                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                        placeholder="0123456789"
                                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold text-sm sm:text-base active:scale-95"
                                >
                                    {t('customer.profile.update_btn')}
                                </button>
                            </form>
                        </div>

                        {/* Password Change Card - Only show for users with password (not OAuth) */}
                        {user?.has_password && (
                            <div className="bg-white shadow rounded-lg sm:rounded-xl p-4 sm:p-6">
                                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{t('customer.profile.change_password')}</h2>
                                <form onSubmit={handlePasswordChange}>
                                    <div className="mb-3 sm:mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">{t('customer.profile.old_password')}</label>
                                        <input
                                            type="password"
                                            value={passwordData.oldPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                            required
                                        />
                                    </div>

                                    <div className="mb-3 sm:mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">{t('customer.profile.new_password')}</label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">{t('customer.profile.min_length')}</p>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">{t('customer.profile.confirm_password')}</label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-green-600 text-white py-2.5 sm:py-3 px-4 rounded-lg hover:bg-green-700 transition duration-200 font-semibold text-sm sm:text-base active:scale-95"
                                    >
                                        {t('customer.profile.change_password_btn')}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
