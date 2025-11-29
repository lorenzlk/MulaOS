'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('domain_channel_mappings', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      domain: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Domain name (e.g., brit.co, spotcovery.com)'
      },
      channelId: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Slack channel ID where the command was executed'
      },
      channelName: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Slack channel name (e.g., #proj-mula-brit)'
      },
      displayName: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Optional display name for the domain (e.g., DeepAI.org for mula-usage-example.vercel.app)'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add unique index on domain
    await queryInterface.addIndex('domain_channel_mappings', {
      fields: ['domain'],
      unique: true,
      name: 'domain_channel_mappings_domain_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('domain_channel_mappings');
  }
}; 