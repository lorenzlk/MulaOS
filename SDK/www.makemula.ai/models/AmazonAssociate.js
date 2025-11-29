const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('AmazonAssociate', {
    tld: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      unique: true
    },
    access_key_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    secret_key: {
      type: DataTypes.STRING,
      allowNull: false
    },
    account_id: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'amazon_associates',
    timestamps: true
  });
}; 