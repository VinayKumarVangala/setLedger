const mongoose = require('mongoose');

// Import schemas from database directory
const path = require('path');
const schemasPath = path.join(__dirname, '../../../database/schemas/mongodb-schemas.js');
const { Organization, User } = require(schemasPath);

module.exports = {
  Organization,
  User
};