const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('DomainChannelMapping', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Domain name (e.g., brit.co, spotcovery.com)'
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
    displayName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Optional display name for the domain (e.g., DeepAI.org for mula-usage-example.vercel.app)'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'domain_channel_mappings',
    indexes: [
      {
        unique: true,
        fields: ['domain']
      }
    ]
  });
}; 