const bcrypt = require('bcrypt');
const { bcryptSaltRounds } = require('../config/env');

async function hashPassword(plain) {
  return bcrypt.hash(plain, bcryptSaltRounds);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, comparePassword };
