'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('next_page_targeting', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      topLevelDomain: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Top-level domain (e.g., www.on3.com, brit.co)'
      },
      targetingType: {
        type: Sequelize.ENUM('path_substring', 'url_pattern', 'ld_json', 'keyword_substring'),
        allowNull: false,
        comment: 'Type of targeting: path_substring, url_pattern, ld_json, or keyword_substring'
      },
      targetingValue: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'The targeting value (path substring, regex pattern, ld+json category, or keyword substring)'
      },
      sectionName: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Section name used for manifest path (e.g., michigan-wolverines, style-inspo)'
      },
      lookbackDays: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 7,
        comment: 'Number of days to look back for article recommendations'
      },
      limit: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 20,
        comment: 'Maximum number of articles to include in section manifest'
      },
      channelId: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Slack channel ID where the command was executed'
      },
      channelName: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Slack channel name (e.g., #proj-mula-on3)'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Soft delete timestamp'
      }
    });

    // Add indexes
    await queryInterface.addIndex('next_page_targeting', {
      fields: ['topLevelDomain'],
      name: 'next_page_targeting_top_level_domain_idx'
    });

    await queryInterface.addIndex('next_page_targeting', {
      fields: ['targetingType'],
      name: 'next_page_targeting_targeting_type_idx'
    });

    await queryInterface.addIndex('next_page_targeting', {
      fields: ['sectionName'],
      name: 'next_page_targeting_section_name_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('next_page_targeting');
  }
};

