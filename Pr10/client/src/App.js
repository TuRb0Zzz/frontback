import React, { useState, useEffect } from 'react';
import ProductsPage from './pages/ProductsPage/ProductsPage';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import { api } from './api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (accessToken && refreshToken) {
      checkAuth();
    } else {
      setLoading(false);
    }
    
    window.addEventListener('logout', handleLogout);
    
    return () => {
      window.removeEventListener('logout', handleLogout);
    };
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await api.getMe();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      await api.login(email, password);
      const userData = await api.getMe();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const handleRegister = async (userData) => {
    try {
      await api.register(userData);
      await handleLogin(userData.email, userData.password);
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <div>Загрузка...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        {showLogin ? (
          <LoginForm onLogin={handleLogin} switchToRegister={() => setShowLogin(false)} />
        ) : (
          <RegisterForm onRegister={handleRegister} switchToLogin={() => setShowLogin(true)} />
        )}
      </div>
    );
  }

  return <ProductsPage user={user} onLogout={handleLogout} />;
}

export default App;