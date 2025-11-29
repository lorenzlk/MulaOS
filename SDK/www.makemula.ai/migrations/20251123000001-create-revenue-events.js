'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('revenue_events', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      domain: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Domain name (e.g., www.on3.com)'
      },
      platform: {
        type: Sequelize.ENUM('impact', 'amazon_associates', 'other'),
        allowNull: false,
        comment: 'Revenue platform: impact, amazon_associates, or other'
      },
      revenue_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Date the revenue event occurred (from affiliate platform)'
      },
      revenue_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Revenue amount in currency'
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD',
        allowNull: false,
        comment: 'Currency code (ISO 4217)'
      },
      attribution_data: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Platform-specific attribution fields (subids, campaign, etc.)'
      },
      subid1: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'SubId1 value (e.g., mula for Impact API)'
      },
      subid2: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'SubId2 value (e.g., session_id for Impact API)'
      },
      subid3: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'SubId3 value (e.g., team/section for Impact API)'
      },
      campaign_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Campaign identifier'
      },
      action_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Transaction/action identifier'
      },
      collection_job_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'revenue_collection_jobs',
          key: 'id'
        },
        onDelete: 'SET NULL',
        comment: 'Reference to the collection job that created this event'
      },
      collected_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'When we collected this data'
      },
      platform_event_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Unique ID from platform (for deduplication)'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('revenue_events', {
      fields: ['domain', 'revenue_date'],
      name: 'revenue_events_domain_date_idx'
    });

    await queryInterface.addIndex('revenue_events', {
      fields: ['platform', 'revenue_date'],
      name: 'revenue_events_platform_date_idx'
    });

    await queryInterface.addIndex('revenue_events', {
      fields: ['subid1'],
      name: 'revenue_events_subid1_idx'
    });

    await queryInterface.addIndex('revenue_events', {
      fields: ['subid2'],
      name: 'revenue_events_subid2_idx'
    });

    await queryInterface.addIndex('revenue_events', {
      fields: ['collection_job_id'],
      name: 'revenue_events_collection_job_idx'
    });

    // Unique index for deduplication (only applies when platform_event_id is not null)
    // Note: PostgreSQL partial unique indexes would require raw SQL
    await queryInterface.addIndex('revenue_events', {
      fields: ['platform', 'platform_event_id', 'domain'],
      unique: true,
      name: 'revenue_events_dedupe_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('revenue_events');
  }
};

