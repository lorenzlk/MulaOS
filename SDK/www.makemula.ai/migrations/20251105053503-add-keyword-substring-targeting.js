'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add 'keyword_substring' to the targetingType ENUM
    // PostgreSQL requires using raw SQL to alter ENUM types
    await queryInterface.sequelize.query(
      "ALTER TYPE \"enum_site_targeting_targetingType\" ADD VALUE IF NOT EXISTS 'keyword_substring'"
    );
  },

  down: async (queryInterface, Sequelize) => {
    // PostgreSQL doesn't support removing ENUM values directly
    // This would require recreating the ENUM type, which is complex and risky
    // For now, we'll leave a comment noting that manual intervention would be needed
    // In practice, we rarely need to rollback ENUM additions
    console.warn('⚠️  Rollback of ENUM value removal is not supported automatically. Manual database intervention required.');
  }
};

