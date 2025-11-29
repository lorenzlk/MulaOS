'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('searches', 'credentialId', {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: 'default',
      comment: 'Identifier for which Amazon credentials to use (default, publisher1, etc.)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('searches', 'credentialId');
  }
};
