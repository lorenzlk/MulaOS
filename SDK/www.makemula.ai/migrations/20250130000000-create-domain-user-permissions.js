'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('domain_user_permissions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      domain: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Domain name (e.g., usmagazine.com)'
      },
      user_email: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'User email address'
      },
      role: {
        type: Sequelize.ENUM('owner', 'admin', 'editor', 'viewer'),
        defaultValue: 'viewer',
        comment: 'User role for this domain'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Whether this permission is active'
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

    // Create unique index on domain + user_email
    await queryInterface.addIndex('domain_user_permissions', {
      fields: ['domain', 'user_email'],
      unique: true,
      name: 'domain_user_permissions_domain_user_email_unique'
    });

    // Create index on domain
    await queryInterface.addIndex('domain_user_permissions', {
      fields: ['domain'],
      name: 'idx_domain_user_permissions_domain'
    });

    // Create index on user_email
    await queryInterface.addIndex('domain_user_permissions', {
      fields: ['user_email'],
      name: 'idx_domain_user_permissions_email'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('domain_user_permissions');
  }
};

