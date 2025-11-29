'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('revenue_collection_jobs', {
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
      status: {
        type: Sequelize.ENUM('pending', 'running', 'completed', 'failed', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false,
        comment: 'Job status'
      },
      scheduledAt: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'When the job was scheduled to run'
      },
      startedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the job started running'
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the job completed'
      },
      lastError: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Last error message if job failed'
      },
      retryCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Number of retry attempts'
      },
      maxRetries: {
        type: Sequelize.INTEGER,
        defaultValue: 3,
        allowNull: false,
        comment: 'Maximum number of retry attempts'
      },
      config: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Platform-specific configuration (date ranges, filters, etc.)'
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
    await queryInterface.addIndex('revenue_collection_jobs', {
      fields: ['domain', 'platform'],
      name: 'revenue_collection_jobs_domain_platform_idx'
    });

    await queryInterface.addIndex('revenue_collection_jobs', {
      fields: ['status'],
      name: 'revenue_collection_jobs_status_idx'
    });

    await queryInterface.addIndex('revenue_collection_jobs', {
      fields: ['scheduledAt'],
      name: 'revenue_collection_jobs_scheduled_at_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('revenue_collection_jobs');
  }
};

