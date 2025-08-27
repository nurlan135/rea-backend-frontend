const { teardownTestDatabase } = require('./setup');

module.exports = async () => {
  await teardownTestDatabase();
  console.log('Test teardown completed');
};