const savedFilterRepository = require('../repositories/savedFilterRepository');

const savedFilterService = {
  list: (userId) => savedFilterRepository.findByUser(userId),
  create: (userId, name, query) => savedFilterRepository.create({ userId, name, query }),
  delete: (id, userId) => savedFilterRepository.delete(id, userId),
};

module.exports = savedFilterService;
