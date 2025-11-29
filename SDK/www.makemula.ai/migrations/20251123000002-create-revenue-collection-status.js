'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('revenue_collection_status', {
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
      last_successful_collection_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the last successful collection completed'
      },
      last_collection_job_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'revenue_collection_jobs',
          key: 'id'
        },
        onDelete: 'SET NULL',
        comment: 'Reference to the last successful collection job'
      },
      last_collected_date_range_start: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Start date of last collected range'
      },
      last_collected_date_range_end: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'End date of last collected range'
      },
      collection_cadence_hours: {
        type: Sequelize.INTEGER,
        defaultValue: 24,
        allowNull: false,
        comment: 'How often to collect (e.g., 24 = daily)'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: 'Whether collection is active for this domain/platform'
      },
      total_events_collected: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Total number of events collected (cumulative)'
      },
      last_collection_duration_seconds: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Duration of last collection in seconds'
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

    // Add unique constraint on domain + platform
    await queryInterface.addIndex('revenue_collection_status', {
      fields: ['domain', 'platform'],
      unique: true,
      name: 'revenue_collection_status_domain_platform_unique'
    });

    // Add index for last collection timestamp
    await queryInterface.addIndex('revenue_collection_status', {
      fields: ['last_successful_collection_at'],
      name: 'revenue_collection_status_last_collection_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('revenue_collection_status');
  }
};

