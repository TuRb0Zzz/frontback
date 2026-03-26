import React, { useState, useEffect } from 'react';
import './ProductsPage.scss';
import ProductList from '../../components/ProductList';
import ProductModal from '../../components/ProductModal';
import UsersList from '../../components/UsersList';
import { api } from '../../api';

export default function ProductsPage({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('products');

  const isSeller = user?.role === 'seller' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  
  useEffect(() => {
    loadProducts();
  }, []);
  
  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      alert('Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  };
  
  const openCreateModal = () => {
    setModalMode('create');
    setEditingProduct(null);
    setModalOpen(true);
  };
  
  const openEditModal = (product) => {
    setModalMode('edit');
    setEditingProduct(product);
    setModalOpen(true);
  };
  
  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      return;
    }
    
    try {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Не удалось удалить товар');
    }
  };
  
  const handleSubmit = async (productData) => {
    try {
      if (modalMode === 'create') {
        const newProduct = await api.createProduct(productData);
        setProducts(prev => [...prev, newProduct]);
      } else {
        const updatedProduct = await api.updateProduct(productData.id, productData);
        setProducts(prev => prev.map(p => 
          p.id === productData.id ? updatedProduct : p
        ));
      }
      closeModal();
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      alert('Не удалось сохранить товар');
    }
  };
  
  return (
    <div className="page">
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <span className="logo-text">СтройМаркет</span>
          </div>
          <div className="user-info">
            <span className="user-name">
              {user?.first_name} {user?.last_name}
              <span className="user-role" data-role={user?.role}>
                {user?.role === 'admin' ? 'Администратор' : 
                 user?.role === 'seller' ? 'Продавец' : 'Пользователь'}
              </span>
            </span>
            <button className="btn-logout" onClick={onLogout}>
              Выйти
            </button>
          </div>
        </div>
      </header>
      
      {/* Вкладки для админа */}
      {isAdmin && (
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Товары
          </button>
          <button 
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Пользователи
          </button>
        </div>
      )}
      
      <main className="main">
        <div className="container">
          {activeTab === 'products' ? (
            <>
              <div className="toolbar">
                <h1 className="page-title">
                  Каталог товаров
                  <span className="products-count">{products.length}</span>
                </h1>
                {isSeller && (
                  <button className="btn btn-primary btn-large" onClick={openCreateModal}>
                    Добавить товар
                  </button>
                )}
              </div>
              
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Загрузка товаров...</p>
                </div>
              ) : (
                <ProductList
                  products={products}
                  onEdit={isSeller ? openEditModal : null}
                  onDelete={isAdmin ? handleDelete : null}
                  canEdit={isSeller}
                  canDelete={isAdmin}
                />
              )}
            </>
          ) : (
            <UsersList />
          )}
        </div>
      </main>
      
      <ProductModal
        open={modalOpen}
        mode={modalMode}
        initialProduct={editingProduct}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}