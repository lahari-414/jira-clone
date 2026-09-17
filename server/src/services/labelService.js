const labelRepository = require('../repositories/labelRepository');
const activityService = require('./activityService');

const labelService = {
  list: (projectId) => labelRepository.findByProject(projectId),
  create: (projectId, name) => labelRepository.create({ projectId, name }),
  async attach(issueId, labelId, userId) {
    const result = await labelRepository.attachToIssue(issueId, labelId);
    await activityService.log({ issueId, userId, action: 'LABEL_ADDED' });
    return result;
  },
  async detach(issueId, labelId, userId) {
    const result = await labelRepository.detachFromIssue(issueId, labelId);
    await activityService.log({ issueId, userId, action: 'LABEL_REMOVED' });
    return result;
  },
};

module.exports = labelService;
