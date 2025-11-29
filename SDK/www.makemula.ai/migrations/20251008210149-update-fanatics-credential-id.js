'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Update all Fanatics searches to use 'on3' credentialId
    await queryInterface.sequelize.query(
      "UPDATE searches SET \"credentialId\" = 'on3' WHERE platform = 'fanatics'"
    );
  },

  async down (queryInterface, Sequelize) {
    // Revert Fanatics searches back to 'default' credentialId
    await queryInterface.sequelize.query(
      "UPDATE searches SET \"credentialId\" = 'default' WHERE platform = 'fanatics'"
    );
  }
};
