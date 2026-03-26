import axios from 'axios';

const apiClient = (token) => axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': token ? `Bearer ${token}` : undefined
  },
  timeout: 5000
});

export const api = {
  // Регистрация
  register: async (userData) => {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      throw error;
    }
  },

  // Вход
  login: async (email, password) => {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', { email, password });
      return response.data; // { accessToken }
    } catch (error) {
      console.error('Ошибка входа:', error);
      throw error;
    }
  },

  // Получить все товары (с токеном)
  getProducts: async (token) => {
    try {
      const response = await apiClient(token).get('/products');
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
      throw error;
    }
  },

  // Создать товар (с токеном)
  createProduct: async (token, product) => {
    try {
      const response = await apiClient(token).post('/products', product);
      return response.data;
    } catch (error) {
      console.error('Ошибка создания товара:', error);
      throw error;
    }
  },

  // Обновить товар (с токеном)
  updateProduct: async (token, id, product) => {
    try {
      const response = await apiClient(token).put(`/products/${id}`, product);
      return response.data;
    } catch (error) {
      console.error('Ошибка обновления товара:', error);
      throw error;
    }
  },

  // Удалить товар (с токеном)
  deleteProduct: async (token, id) => {
    try {
      const response = await apiClient(token).delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка удаления товара:', error);
      throw error;
    }
  }
};