import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

// ... imports

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    // Lấy token từ localStorage (hoặc từ AuthContext nếu bạn muốn truyền vào)
    const token = localStorage.getItem('token'); 

    useEffect(() => {
        if (!token) return; // Không có token thì không connect

        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001', {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            auth: {
                token: token 
            }
        });

        setSocket(newSocket);

        return () => newSocket.close();
    }, [token]); // Thêm token vào dependency

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}