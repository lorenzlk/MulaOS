'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('site_targeting', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      topLevelDomain: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Top-level domain (e.g., brit.co, spotcovery.com)'
      },
      targetingType: {
        type: Sequelize.ENUM('path_substring', 'url_pattern', 'ld_json'),
        allowNull: false,
        comment: 'Type of targeting: path_substring, url_pattern, or ld_json'
      },
      targetingValue: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'The targeting value (path substring, regex pattern, or ld+json category)'
      },
      searchPhrase: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Search phrase to use when targeting matches'
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
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('site_targeting', {
      fields: ['topLevelDomain'],
      name: 'site_targeting_top_level_domain_idx'
    });

    await queryInterface.addIndex('site_targeting', {
      fields: ['targetingType'],
      name: 'site_targeting_targeting_type_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('site_targeting');
  }
}; 