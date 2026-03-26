import React from 'react';
import ProductCard from './ProductCard';

export default function ProductList({ products, onEdit, onDelete }) {
  if (!products || products.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🏗️</div>
        <h3>Товаров пока нет</h3>
        <p>Нажмите "Добавить товар", чтобы начать наполнение каталога</p>
      </div>
    );
  }
  
  return (
    <div className="products-grid">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}