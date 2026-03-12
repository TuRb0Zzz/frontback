import React, { useState, useEffect } from 'react';

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    stock: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    
    if (initialProduct && mode === 'edit') {
      setFormData({
        name: initialProduct.name || '',
        category: initialProduct.category || '',
        description: initialProduct.description || '',
        price: String(initialProduct.price || ''),
        stock: String(initialProduct.stock || '')
      });
    } else {
      // Сброс формы для создания
      setFormData({
        name: '',
        category: '',
        description: '',
        price: '',
        stock: ''
      });
    }
    setErrors({});
  }, [open, initialProduct, mode]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Очищаем ошибку для этого поля
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Введите название товара';
    if (!formData.category.trim()) newErrors.category = 'Введите категорию';
    if (!formData.description.trim()) newErrors.description = 'Введите описание';
    
    const price = Number(formData.price);
    if (!formData.price) {
      newErrors.price = 'Введите цену';
    } else if (!Number.isFinite(price) || price <= 0) {
      newErrors.price = 'Цена должна быть положительным числом';
    }
    
    const stock = Number(formData.stock);
    if (!formData.stock && formData.stock !== '0') {
      newErrors.stock = 'Введите количество';
    } else if (!Number.isFinite(stock) || stock < 0) {
      newErrors.stock = 'Количество должно быть неотрицательным числом';
    }
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit({
      id: initialProduct?.id,
      name: formData.name.trim(),
      category: formData.category.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      stock: Number(formData.stock)
    });
  };

  const title = mode === 'edit' ? 'Редактирование товара' : 'Добавление нового товара';
  const submitText = mode === 'edit' ? 'Сохранить изменения' : 'Добавить товар';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Название товара *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Например: Цемент М500 50кг"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="category">Категория *</label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Например: Сыпучие материалы"
              className={errors.category ? 'error' : ''}
            />
            {errors.category && <span className="error-message">{errors.category}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Описание *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Подробное описание товара"
              rows="3"
              className={errors.description ? 'error' : ''}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Цена (₽) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="550"
                min="1"
                step="1"
                className={errors.price ? 'error' : ''}
              />
              {errors.price && <span className="error-message">{errors.price}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="stock">Количество на складе *</label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="45"
                min="0"
                step="1"
                className={errors.stock ? 'error' : ''}
              />
              {errors.stock && <span className="error-message">{errors.stock}</span>}
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}