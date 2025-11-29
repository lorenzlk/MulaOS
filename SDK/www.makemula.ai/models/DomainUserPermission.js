const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('DomainUserPermission', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Domain name (e.g., usmagazine.com)'
    },
    user_email: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'User email address'
    },
    role: {
      type: DataTypes.ENUM('owner', 'admin', 'editor', 'viewer'),
      defaultValue: 'viewer',
      comment: 'User role for this domain'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this permission is active'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'domain_user_permissions',
    indexes: [
      {
        unique: true,
        fields: ['domain', 'user_email']
      },
      {
        fields: ['domain']
      },
      {
        fields: ['user_email']
      }
    ]
  });
};

