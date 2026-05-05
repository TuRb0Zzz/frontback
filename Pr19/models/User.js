const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      isInt: true,
    },
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'users',
  timestamps: false,
  hooks: {
    beforeUpdate: (user) => {
      user.updated_at = new Date();
    },
  },
});

User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  values.created_at = values.created_at ? Math.floor(new Date(values.created_at).getTime() / 1000) : null;
  values.updated_at = values.updated_at ? Math.floor(new Date(values.updated_at).getTime() / 1000) : null;
  return values;
};

module.exports = User;