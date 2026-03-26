import React, { useState, useEffect } from 'react';

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
    image: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    
    if (initialProduct && mode === 'edit') {
      setFormData({
        title: initialProduct.title || '',
        category: initialProduct.category || '',
        description: initialProduct.description || '',
        price: String(initialProduct.price || ''),
        image: initialProduct.image || ''
      });
    } else {
      setFormData({
        title: '',
        category: '',
        description: '',
        price: '',
        image: ''
      });
    }
    setErrors({});
  }, [open, initialProduct, mode]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Введите название товара';
    if (!formData.category.trim()) newErrors.category = 'Введите категорию';
    if (!formData.description.trim()) newErrors.description = 'Введите описание';
    
    const price = Number(formData.price);
    if (!formData.price) {
      newErrors.price = 'Введите цену';
    } else if (!Number.isFinite(price) || price <= 0) {
      newErrors.price = 'Цена должна быть положительным числом';
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
      title: formData.title.trim(),
      category: formData.category.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      image: formData.image.trim() || `/images/${Math.floor(Math.random() * 3) + 1}.jpg` // случайное изображение по умолчанию
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
            <label htmlFor="title">Название товара *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Например: Цемент М500 50кг"
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="category">Категория *</label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Например: Стройматериалы"
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
            <label htmlFor="image">URL изображения</label>
            <input
              type="text"
              id="image"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="/images/1.jpg (оставьте пустым для случайного)"
            />
            <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
              Доступные изображения: /images/1.jpg, /images/2.jpg, /images/3.jpg
            </small>
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