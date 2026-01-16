import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

// ... imports

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    // Lấy token từ localStorage (hoặc từ AuthContext nếu bạn muốn truyền vào)
    // const token = localStorage.getItem('token'); // This line is moved inside useEffect

    useEffect(() => {
        // ✅ Kết nối WebSocket cho cả guest và authenticated users
        const token = localStorage.getItem('token');

        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001', {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            auth: {
                token: token || null // Gửi token nếu có, null nếu là guest
            }
        });

        console.log('🔌 Connecting to WebSocket...', token ? 'with token' : 'as guest');

        newSocket.on('connect', () => {
            console.log('✅ WebSocket connected:', newSocket.id);
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ WebSocket connection error:', error.message);
        });

        setSocket(newSocket);

        return () => {
            console.log('🔌 Disconnecting WebSocket...');
            newSocket.close();
        };
    }, []); // Chỉ connect một lần khi component mount

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}