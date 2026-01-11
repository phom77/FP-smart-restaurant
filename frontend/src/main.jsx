import React from 'react'
import { createRoot } from 'react-dom/client' // 1. Import createRoot
import { BrowserRouter } from 'react-router-dom' // 2. Import BrowserRouter (QUAN TRỌNG)
import './index.css'
import App from './App.jsx'
import { CartProvider } from './contexts/CartContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { SocketProvider } from './contexts/SocketContext';

// 3. Dùng createRoot trực tiếp (không cần ReactDOM.createRoot)
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* Bọc Router ở ngoài cùng */}
      <AuthProvider>
        <SocketProvider> 
          <CartProvider>
            <App />
          </CartProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)