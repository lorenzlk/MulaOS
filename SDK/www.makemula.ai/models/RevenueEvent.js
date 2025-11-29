const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('RevenueEvent', {
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
    revenue_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Date the revenue event occurred (from affiliate platform)'
    },
    revenue_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Revenue amount in currency'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
      allowNull: false,
      comment: 'Currency code (ISO 4217)'
    },
    attribution_data: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Platform-specific attribution fields (subids, campaign, etc.)'
    },
    subid1: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'SubId1 value (e.g., mula for Impact API)'
    },
    subid2: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'SubId2 value (e.g., session_id for Impact API)'
    },
    subid3: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'SubId3 value (e.g., team/section for Impact API)'
    },
    campaign_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Campaign identifier'
    },
    action_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Transaction/action identifier'
    },
    collection_job_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Reference to the collection job that created this event'
    },
    collected_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When we collected this data'
    },
    platform_event_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Unique ID from platform (for deduplication)'
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
    tableName: 'revenue_events',
    indexes: [
      {
        fields: ['domain', 'revenue_date']
      },
      {
        fields: ['platform', 'revenue_date']
      },
      {
        fields: ['subid1']
      },
      {
        fields: ['subid2']
      },
      {
        fields: ['collection_job_id']
      },
      {
        unique: true,
        fields: ['platform', 'platform_event_id', 'domain'],
        name: 'revenue_events_dedupe_idx'
      }
    ]
  });
};

