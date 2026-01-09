import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MenuPage from './pages/customer/MenuPage';
import LoginPage from './pages/auth/LoginPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;