import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleFakeAdminLogin = () => {
        const fakeUser = {
            id: 'admin-123',
            email: 'admin@restaurant.com',
            full_name: 'Admin User',
            role: 'admin'
        };
        const fakeToken = 'fake-jwt-token-for-testing'; // In real app, this comes from API

        login(fakeUser, fakeToken);
        navigate('/admin');
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
            <h1 className="text-3xl font-bold mb-8">Login Page (Dev Mode)</h1>

            <button
                onClick={handleFakeAdminLogin}
                className="bg-blue-600 text-white px-6 py-3 rounded shadow hover:bg-blue-700 font-semibold"
            >
                Fake Login Admin
            </button>

            <p className="mt-4 text-gray-500 text-sm">
                Click above to simulate logging in as an Admin.
            </p>
        </div>
    );
}
