import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động gắn token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Xử lý lỗi 403 (banned user)
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    // Check if it's a 403 error with banned account message
    if (error.response?.status === 403) {
      const message = error.response?.data?.message || '';

      // Detect banned account (message contains "khóa")
      if (message.includes('khóa')) {
        // Clear authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Redirect to login with error parameter
        window.location.href = '/login?error=account_banned';

        // Return a rejected promise to prevent further error handling
        return Promise.reject(error);
      }
    }

    // For all other errors, pass them through
    return Promise.reject(error);
  }
);

export default api;