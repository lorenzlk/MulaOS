const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('NextPageTargeting', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    topLevelDomain: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Top-level domain (e.g., www.on3.com, brit.co)'
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
    sectionName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Section name used for manifest path (e.g., michigan-wolverines, style-inspo)'
    },
    lookbackDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 7,
      comment: 'Number of days to look back for article recommendations'
    },
    limit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 20,
      comment: 'Maximum number of articles to include in section manifest'
    },
    channelId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Slack channel ID where the command was executed'
    },
    channelName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Slack channel name (e.g., #proj-mula-on3)'
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
    tableName: 'next_page_targeting',
    paranoid: true, // Enable soft deletes
    indexes: [
      {
        fields: ['topLevelDomain']
      },
      {
        fields: ['targetingType']
      },
      {
        fields: ['sectionName']
      }
    ]
  });
};

