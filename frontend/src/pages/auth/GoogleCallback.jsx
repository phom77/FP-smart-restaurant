import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { claimGuestOrders } from '../../utils/guestOrders';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get('token');
            const error = searchParams.get('error');

            if (error) {
                // OAuth failed
                alert('Đăng nhập Google thất bại. Vui lòng thử lại.');
                navigate('/login');
                return;
            }

            if (token) {
                try {
                    // Fetch user data
                    const response = await axios.get(`${API_URL}/api/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (response.data.success) {
                        const user = response.data.user;

                        // Update AuthContext with user and token
                        login(user, token);

                        // Claim guest orders if any
                        const claimResult = await claimGuestOrders(token);
                        if (claimResult.success && claimResult.claimed > 0) {
                            console.log(`Claimed ${claimResult.claimed} guest orders`);
                        }

                        // Redirect based on role
                        if (user.role === 'admin') {
                            navigate('/admin/dashboard');
                        } else if (user.role === 'waiter') {
                            navigate('/waiter/orders');
                        } else if (user.role === 'kitchen') {
                            navigate('/kitchen/orders');
                        } else {
                            navigate('/menu');
                        }
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    navigate('/login');
                }
            } else {
                // No token found
                navigate('/login');
            }
        };

        handleCallback();
    }, [searchParams, navigate, login]);

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Đang xử lý đăng nhập...</p>
            </div>
        </div>
    );
};

export default GoogleCallback;
