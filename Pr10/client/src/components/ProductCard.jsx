import React from 'react';

export default function ProductCard({ product, onEdit, onDelete }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  return (
    <div className="product-card">
      <div className="product-category">
        {product.category}
      </div>
      
      <h3 className="product-name">{product.title}</h3>
      
      <p className="product-description">{product.description}</p>
      
      <div className="product-footer">
        <div className="product-price">
          {formatPrice(product.price)}
        </div>
      </div>
      
      <div className="product-actions">
        <button 
          className="btn btn-edit" 
          onClick={() => onEdit(product)}
        >
          Редактировать
        </button>
        <button 
          className="btn btn-delete" 
          onClick={() => onDelete(product.id)}
        >
          Удалить
        </button>
      </div>
    </div>
  );
}