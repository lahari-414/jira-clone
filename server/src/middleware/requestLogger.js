const morgan = require('morgan');

// Skip noisy logs in test environment
const requestLogger = morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  skip: () => process.env.NODE_ENV === 'test',
});

module.exports = requestLogger;
