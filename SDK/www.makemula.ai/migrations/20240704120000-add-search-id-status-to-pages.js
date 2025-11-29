'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('pages', 'searchIdStatus', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Approval status of the current page-search relationship'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('pages', 'searchIdStatus');
    // Optionally, drop the ENUM type if not used elsewhere
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pages_searchIdStatus";');
  }
}; 