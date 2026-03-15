import React, { useState, useEffect } from 'react';
import ProductsPage from './pages/ProductsPage/ProductsPage';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [showLogin, setShowLogin] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Ошибка получения пользователя:', error);
    }
  };

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f1219'
      }}>
        {showLogin ? (
          <LoginForm onLogin={handleLogin} switchToRegister={() => setShowLogin(false)} />
        ) : (
          <RegisterForm onRegister={handleLogin} switchToLogin={() => setShowLogin(true)} />
        )}
      </div>
    );
  }

  return <ProductsPage token={token} user={user} onLogout={logout} />;
}

export default App;