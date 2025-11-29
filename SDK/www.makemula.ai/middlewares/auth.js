const basicAuth = require('basic-auth');

const auth = (req, res, next) => {
  if(process.env.NODE_ENV === 'development') {
    next();
    return;
  }
  const user = basicAuth(req);
  const validUser = user && user.name === process.env.BASIC_AUTH_USERNAME && user.pass === process.env.BASIC_AUTH_PASSWORD;

  if (!validUser) {
    res.set('WWW-Authenticate', 'Basic realm="Restricted Area"');
    return res.status(401).send('Authentication required.');
  }
  next();
};

module.exports = auth;
