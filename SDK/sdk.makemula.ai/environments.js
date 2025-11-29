module.exports = {
  production: {
    CDN_HOST: 'https://cdn.makemula.ai',
    version: process.env.npm_package_version,
    LOG_LEVEL: 0,
    SDK_ENVIRONMENT: 'production'
  },
  development: {
    CDN_HOST: 'http://localhost:3001',
    version: process.env.npm_package_version,
    LOG_LEVEL: 1,
    SDK_ENVIRONMENT: 'development',
  }
};
