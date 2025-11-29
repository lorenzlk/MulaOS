const { Sequelize } = require('sequelize');

// Detect if this is a local connection (localhost or 127.0.0.1)
const isLocalConnection = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.includes('localhost') || 
  process.env.DATABASE_URL.includes('127.0.0.1') ||
  process.env.NODE_ENV === 'development'
);

const dialectOptions = isLocalConnection ? {
  ssl: false
} : {
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
};

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: false
});

const Page = require('./Page')(sequelize);
const Search = require('./Search')(sequelize);
const AmazonAssociate = require('./AmazonAssociate')(sequelize);
const DomainChannelMapping = require('./DomainChannelMapping')(sequelize);
const SiteTargeting = require('./SiteTargeting')(sequelize);
const NextPageTargeting = require('./NextPageTargeting')(sequelize);
const DomainUserPermission = require('./DomainUserPermission')(sequelize);
const RevenueCollectionJob = require('./RevenueCollectionJob')(sequelize);
const RevenueEvent = require('./RevenueEvent')(sequelize);
const RevenueCollectionStatus = require('./RevenueCollectionStatus')(sequelize);

// Set up associations
Page.belongsTo(Search, { foreignKey: 'searchId', as: 'Search' });
Search.hasMany(Page, { foreignKey: 'searchId', as: 'Pages' });

// Revenue system associations
RevenueEvent.belongsTo(RevenueCollectionJob, { foreignKey: 'collection_job_id', as: 'CollectionJob' });
RevenueCollectionJob.hasMany(RevenueEvent, { foreignKey: 'collection_job_id', as: 'RevenueEvents' });
RevenueCollectionStatus.belongsTo(RevenueCollectionJob, { foreignKey: 'last_collection_job_id', as: 'LastCollectionJob' });

module.exports = { 
  sequelize, 
  Page, 
  Search, 
  AmazonAssociate, 
  DomainChannelMapping, 
  SiteTargeting, 
  NextPageTargeting, 
  DomainUserPermission,
  RevenueCollectionJob,
  RevenueEvent,
  RevenueCollectionStatus
};
