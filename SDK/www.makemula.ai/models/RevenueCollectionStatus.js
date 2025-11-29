const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('RevenueCollectionStatus', {
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
    last_successful_collection_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the last successful collection completed'
    },
    last_collection_job_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Reference to the last successful collection job'
    },
    last_collected_date_range_start: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Start date of last collected range'
    },
    last_collected_date_range_end: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'End date of last collected range'
    },
    collection_cadence_hours: {
      type: DataTypes.INTEGER,
      defaultValue: 24,
      allowNull: false,
      comment: 'How often to collect (e.g., 24 = daily)'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Whether collection is active for this domain/platform'
    },
    total_events_collected: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Total number of events collected (cumulative)'
    },
    last_collection_duration_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration of last collection in seconds'
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
    tableName: 'revenue_collection_status',
    indexes: [
      {
        unique: true,
        fields: ['domain', 'platform']
      },
      {
        fields: ['last_successful_collection_at']
      }
    ]
  });
};

