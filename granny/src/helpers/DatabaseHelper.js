// Database configuration for Granny
// Uses same Postgres DB as main Mula SDK

const { Sequelize } = require('sequelize');

// Detect if this is a local connection
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

// Database connection (uses DATABASE_URL from environment)
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://localhost:5432/mula_dev',
  {
    dialect: 'postgres',
    dialectOptions,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: false
  }
);

class DatabaseHelper {
  async checkDeployment(domain) {
    try {
      // Test database connection first
      await sequelize.authenticate();
      
      // Check if domain exists in domain_channel_mappings
      // If it's mapped to a Slack channel, it means it's deployed
      const results = await sequelize.query(`
        SELECT 
          domain,
          "displayName",
          "channelName",
          "createdAt" as deployment_date
        FROM domain_channel_mappings
        WHERE domain = :domain
        LIMIT 1
      `, {
        replacements: { domain },
        type: Sequelize.QueryTypes.SELECT
      });
      
      if (results && results.length > 0) {
        const deployment = results[0];
        return {
          deployed: true,
          method: 'database',
          deployment_date: deployment.deployment_date,
          slack_channel: deployment.channelName,
          display_name: deployment.displayName || domain
        };
      }
      
      // Also check for www. prefix
      const wwwDomain = domain.startsWith('www.') ? domain : `www.${domain}`;
      const wwwResults = await sequelize.query(`
        SELECT 
          domain,
          "displayName",
          "channelName",
          "createdAt" as deployment_date
        FROM domain_channel_mappings
        WHERE domain = :domain
        LIMIT 1
      `, {
        replacements: { domain: wwwDomain },
        type: Sequelize.QueryTypes.SELECT
      });
      
      if (wwwResults && wwwResults.length > 0) {
        const deployment = wwwResults[0];
        return {
          deployed: true,
          method: 'database',
          deployment_date: deployment.deployment_date,
          slack_channel: deployment.channelName,
          display_name: deployment.displayName || wwwDomain
        };
      }
      
      return { deployed: false };
      
    } catch (error) {
      // Log error but don't fail the whole check
      console.log(`  ⚠️  Database check failed: ${error.message}`);
      return { deployed: false, error: error.message };
    }
  }
  
  async getExistingTargeting(domain) {
    try {
      const [results] = await sequelize.query(`
        SELECT 
          id,
          domain,
          path_type,
          match_value as path,
          search_phrase,
          status,
          "createdAt" as created_at
        FROM site_targeting
        WHERE domain IN (:domain, :wwwDomain)
          AND status = 'active'
          AND "deletedAt" IS NULL
        ORDER BY "createdAt" DESC
      `, {
        replacements: { 
          domain,
          wwwDomain: domain.startsWith('www.') ? domain : `www.${domain}`
        },
        type: sequelize.QueryTypes.SELECT
      });
      
      return results || [];
      
    } catch (error) {
      console.error('Failed to get targeting rules:', error.message);
      return [];
    }
  }
  
  async close() {
    await sequelize.close();
  }
}

module.exports = DatabaseHelper;

