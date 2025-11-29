const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Page', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    url: {
      type: DataTypes.STRING(4096),
      allowNull: false,
      unique: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    proposedKeywords: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    keywordFeedback: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    keywordStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    searchId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'searches',
        key: 'id'
      },
      comment: 'Currently selected search (best results)'
    },
    searchIdStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'Approval status of the current page-search relationship'
    },
    searchAttempts: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of search IDs attempted for this page'
    },
    searchStrategy: {
      type: DataTypes.STRING,
      defaultValue: 'progressive',
      comment: 'Search strategy used for this page'
    },
    searchStatus: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
      comment: 'Status of the search process for this page'
    }
  }, {
    tableName: 'pages',
  });
};
