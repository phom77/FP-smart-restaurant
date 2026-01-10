import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
    // Kết nối tới Backend
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001', {
      withCredentials: true,
      transports: ['websocket', 'polling'] // Ưu tiên websocket
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}