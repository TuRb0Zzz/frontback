import React from 'react';

export default function ProductCard({ product, onEdit, onDelete, canEdit, canDelete }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  return (
    <div className="product-card">
      {/* Изображение товара */}
      {product.image && (
        <div className="product-image">
          <img 
            src={`http://localhost:3000${product.image}`} 
            alt={product.title}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'http://localhost:3000/images/default.jpg';
            }}
          />
        </div>
      )}
      
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
      
      {(canEdit || canDelete) && (
        <div className="product-actions">
          {canEdit && (
            <button className="btn btn-edit" onClick={() => onEdit(product)}>
              Редактировать
            </button>
          )}
          {canDelete && (
            <button className="btn btn-delete" onClick={() => onDelete(product.id)}>
              Удалить
            </button>
          )}
        </div>
      )}
    </div>
  );
}