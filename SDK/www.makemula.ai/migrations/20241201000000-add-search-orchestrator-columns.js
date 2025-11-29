'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns to searches table
    await queryInterface.addColumn('searches', 'platform', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'amazon',
      comment: 'Platform for this search (amazon, google_shopping, fanatics)'
    });

    await queryInterface.addColumn('searches', 'platformConfig', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Platform-specific configuration (e.g., searchIndex for Amazon, location for Google)'
    });

    await queryInterface.addColumn('searches', 'productCount', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Number of products found in this search'
    });

    await queryInterface.addColumn('searches', 'qualityScore', {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: 'LLM-assessed quality score of search results'
    });

    await queryInterface.addColumn('searches', 'status', {
      type: Sequelize.STRING,
      defaultValue: 'pending',
      comment: 'Status of the search execution'
    });

    await queryInterface.addColumn('searches', 'errorMessage', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Error message if search failed'
    });

    await queryInterface.addColumn('searches', 'executedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When the search was executed'
    });

    // Add new columns to pages table
    await queryInterface.addColumn('pages', 'searchAttempts', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of search IDs attempted for this page'
    });

    await queryInterface.addColumn('pages', 'searchStrategy', {
      type: Sequelize.STRING,
      defaultValue: 'progressive',
      comment: 'Search strategy used for this page'
    });

    await queryInterface.addColumn('pages', 'searchStatus', {
      type: Sequelize.STRING,
      defaultValue: 'pending',
      comment: 'Status of the search process for this page'
    });

    // Update unique constraints
    try {
      await queryInterface.removeConstraint('searches', 'searches_phrase_key');
    } catch (e) {}
    
    try {
      await queryInterface.removeConstraint('searches', 'searches_phraseID_key');
    } catch (e) {}

    // Add new unique constraint
    try {
      await queryInterface.addConstraint('searches', {
        fields: ['phrase', 'platform', 'platformConfig'],
        type: 'unique',
        name: 'searches_phrase_platform_config_unique'
      });
    } catch (e) {}
  },

  down: async (queryInterface, Sequelize) => {
    // Remove new columns from searches
    await queryInterface.removeColumn('searches', 'executedAt');
    await queryInterface.removeColumn('searches', 'errorMessage');
    await queryInterface.removeColumn('searches', 'status');
    await queryInterface.removeColumn('searches', 'qualityScore');
    await queryInterface.removeColumn('searches', 'productCount');
    await queryInterface.removeColumn('searches', 'platformConfig');
    await queryInterface.removeColumn('searches', 'platform');

    // Remove new columns from pages
    await queryInterface.removeColumn('pages', 'searchStatus');
    await queryInterface.removeColumn('pages', 'searchStrategy');
    await queryInterface.removeColumn('pages', 'searchAttempts');

    // Restore old unique constraints
    await queryInterface.addConstraint('searches', {
      fields: ['phrase'],
      type: 'unique',
      name: 'searches_phrase_key'
    });

    await queryInterface.addConstraint('searches', {
      fields: ['phraseID'],
      type: 'unique',
      name: 'searches_phraseID_key'
    });

    // Remove new unique constraint
    try {
      await queryInterface.removeConstraint('searches', 'searches_phrase_platform_config_unique');
    } catch (e) {}
  }
}; 