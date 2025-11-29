const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('RevenueCollectionJob', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    domain: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Domain name (e.g., www.on3.com)'
    },
    platform: {
      type: DataTypes.ENUM('impact', 'amazon_associates', 'other'),
      allowNull: false,
      comment: 'Revenue platform: impact, amazon_associates, or other'
    },
    status: {
      type: DataTypes.ENUM('pending', 'running', 'completed', 'failed', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'Job status'
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'When the job was scheduled to run'
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the job started running'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the job completed'
    },
    lastError: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Last error message if job failed'
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Number of retry attempts'
    },
    maxRetries: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      allowNull: false,
      comment: 'Maximum number of retry attempts'
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Platform-specific configuration (date ranges, filters, etc.)'
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
    tableName: 'revenue_collection_jobs',
    indexes: [
      {
        fields: ['domain', 'platform']
      },
      {
        fields: ['status']
      },
      {
        fields: ['scheduledAt']
      }
    ]
  });
};

