import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
// 1. Import useAuth để theo dõi trạng thái đăng nhập
import { useAuth } from './AuthContext'; 

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    
    // 2. Lấy token từ AuthContext (Thay vì lấy trực tiếp từ localStorage)
    // Điều này giúp Socket biết khi nào user đăng nhập/đăng xuất
    const { token } = useAuth(); 

    useEffect(() => {
        // Nếu không có token và bạn muốn Guest cũng dùng được (ví dụ khách hàng scan QR)
        // thì vẫn connect. Nhưng nếu muốn chắc chắn, có thể check token ở đây.
        
        const currentToken = token || localStorage.getItem('token');
        
        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001', {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            // 3. Quan trọng: Luôn gửi token mới nhất
            auth: {
                token: currentToken
            },
            // Thêm options để đảm bảo kết nối ổn định hơn
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        console.log(`🔌 Socket initializing... Token: ${currentToken ? 'Present' : 'Missing (Guest)'}`);

        newSocket.on('connect', () => {
            console.log('✅ WebSocket connected:', newSocket.id);
            
            // 4. Nếu là Admin/Kitchen, tự động rejoin room khi connect lại
            // Logic này hỗ trợ cho việc reload trang hoặc rớt mạng
            if (currentToken) {
               // Bạn có thể emit sự kiện để backend biết user này là ai ngay lập tức nếu cần
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ WebSocket connection error:', error.message);
        });

        setSocket(newSocket);

        // Cleanup: Ngắt kết nối khi component unmount hoặc TOKEN THAY ĐỔI
        return () => {
            console.log('🔌 Disconnecting WebSocket...');
            newSocket.disconnect();
        };

    // 5. QUAN TRỌNG NHẤT: Thêm [token] vào dependency array
    // Để mỗi khi đăng nhập/đăng xuất, socket sẽ tự khởi động lại với quyền mới
    }, [token]); 

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}