import React, { useState, useEffect } from 'react';
import { api } from '../api';
import './UsersList.scss';

const ROLES = {
  user: 'Пользователь',
  seller: 'Продавец',
  admin: 'Администратор'
};

const ROLE_OPTIONS = [
  { value: 'user', label: 'Пользователь' },
  { value: 'seller', label: 'Продавец' },
  { value: 'admin', label: 'Администратор' }
];

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError('Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const updatedUser = await api.updateUser(userId, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      setEditingUser(null);
    } catch (err) {
      setError('Ошибка обновления роли');
    }
  };

  const handleBlockUser = async (userId) => {
    if (!window.confirm('Вы уверены, что хотите заблокировать этого пользователя?')) return;
    
    try {
      await api.blockUser(userId);
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isActive: false } : u
      ));
    } catch (err) {
      setError('Ошибка блокировки пользователя');
    }
  };

  if (loading) {
    return <div className="loading">Загрузка пользователей...</div>;
  }

  return (
    <div className="users-list">
      <h2>Управление пользователями</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <table className="users-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Имя</th>
            <th>Фамилия</th>
            <th>Роль</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className={!user.isActive ? 'blocked' : ''}>
              <td>{user.email}</td>
              <td>{user.first_name}</td>
              <td>{user.last_name}</td>
              <td>
                {editingUser === user.id ? (
                  <select
                    value={user.role}
                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                    className="role-select"
                  >
                    {ROLE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <span className="role-badge" data-role={user.role}>
                    {ROLES[user.role] || user.role}
                  </span>
                )}
              </td>
              <td>
                <span className={`status-badge ${user.isActive ? 'active' : 'blocked'}`}>
                  {user.isActive ? 'Активен' : 'Заблокирован'}
                </span>
              </td>
              <td className="actions">
                {editingUser === user.id ? (
                  <button className="btn-cancel" onClick={() => setEditingUser(null)}>
                    Отмена
                  </button>
                ) : (
                  <button className="btn-edit" onClick={() => setEditingUser(user.id)}>
                    Изменить роль
                  </button>
                )}
                {user.isActive && (
                  <button className="btn-block" onClick={() => handleBlockUser(user.id)}>
                    Заблокировать
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}