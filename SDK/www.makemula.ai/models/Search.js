const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  return sequelize.define('Search', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    phrase: {
      type: DataTypes.STRING(2048),
      allowNull: false,
      unique: false
    },
    phraseID: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    platform: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'amazon',
      comment: 'Platform for this search (amazon, google_shopping, fanatics)'
    },
    platformConfig: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Platform-specific configuration (e.g., searchIndex for Amazon, location for Google)'
    },
    productCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Number of products found in this search'
    },
    qualityScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'LLM-assessed quality score of search results'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
      comment: 'Status of the search execution'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error message if search failed'
    },
    executedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the search was executed'
    },
    credentialId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'default',
      comment: 'Identifier for which Amazon credentials to use (default, publisher1, etc.)'
    }
  }, {
    tableName: 'searches',
    indexes: [
      {
        unique: true,
        fields: ['phrase', 'platform', 'platformConfig']
      }
    ]
  });
}; 