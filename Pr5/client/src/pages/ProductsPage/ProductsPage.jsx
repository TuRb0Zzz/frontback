import React, { useState, useEffect } from 'react';
import './ProductsPage.scss';
import ProductList from '../../components/ProductList';
import ProductModal from '../../components/ProductModal';
import { api } from '../../api';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingProduct, setEditingProduct] = useState(null);
  
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
      alert('Не удалось загрузить товары. Проверьте подключение к серверу.');
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
        </div>
      </header>
      
      <main className="main">
        <div className="container">
          <div className="toolbar">
            <h1 className="page-title">
              Каталог товаров
            </h1>
            <button className="btn btn-primary btn-large" onClick={openCreateModal}>
              Добавить товар
            </button>
          </div>
          
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Загрузка товаров...</p>
            </div>
          ) : (
            <ProductList
              products={products}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
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