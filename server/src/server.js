require('./config/env');
const app = require('./app');
const { port } = require('./config/env');

const server = app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));

module.exports = server;
