'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('site_targeting', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Soft delete timestamp'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('site_targeting', 'deletedAt');
  }
}; 