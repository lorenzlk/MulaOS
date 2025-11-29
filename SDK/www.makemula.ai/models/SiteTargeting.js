const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('SiteTargeting', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    topLevelDomain: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Top-level domain (e.g., brit.co, spotcovery.com)'
    },
    targetingType: {
      type: DataTypes.ENUM('path_substring', 'url_pattern', 'ld_json', 'keyword_substring'),
      allowNull: false,
      comment: 'Type of targeting: path_substring, url_pattern, ld_json, or keyword_substring'
    },
    targetingValue: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'The targeting value (path substring, regex pattern, ld+json category, or keyword substring)'
    },
    searchPhrase: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Search phrase to use when targeting matches'
    },
    channelId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Slack channel ID where the command was executed'
    },
    channelName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Slack channel name (e.g., #proj-mula-brit)'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Soft delete timestamp'
    }
  }, {
    tableName: 'site_targeting',
    paranoid: true, // Enable soft deletes
    indexes: [
      {
        fields: ['topLevelDomain']
      },
      {
        fields: ['targetingType']
      }
    ]
  });
}; 