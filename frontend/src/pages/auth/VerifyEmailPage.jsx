import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api'; // Đảm bảo bạn đã có axios instance

const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Đang xác thực tài khoản...');

    useEffect(() => {
        const verify = async () => {
            const token = searchParams.get('token');
            if (!token) {
                setStatus('error');
                setMessage('Link không hợp lệ.');
                return;
            }

            try {
                // Gọi API Verify mà chúng ta vừa viết ở Backend
                await api.post('/api/auth/verify-email', { token });
                setStatus('success');
                setMessage('Kích hoạt tài khoản thành công!');
                
                // Chuyển sang trang login sau 3s
                setTimeout(() => navigate('/login'), 3000);
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Xác thực thất bại.');
            }
        };

        verify();
    }, [searchParams, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                <h2 className="text-2xl font-bold mb-4">Xác thực Email</h2>
                
                {status === 'verifying' && <p className="text-blue-600">⏳ {message}</p>}
                
                {status === 'success' && (
                    <div>
                        <p className="text-green-600 font-bold text-lg">✅ {message}</p>
                        <p className="text-gray-500 mt-2">Đang chuyển hướng đến trang đăng nhập...</p>
                    </div>
                )}
                
                {status === 'error' && (
                    <div>
                        <p className="text-red-600 font-bold">❌ {message}</p>
                        <button 
                            onClick={() => navigate('/login')}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Về trang đăng nhập
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;