const activityRepository = require('../repositories/activityRepository');

const activityService = {
  log({ issueId, userId, action, oldValue, newValue }) {
    return activityRepository.create({
      issueId,
      userId,
      action,
      oldValue: oldValue != null ? String(oldValue) : null,
      newValue: newValue != null ? String(newValue) : null,
    });
  },
  listForIssue: (issueId) => activityRepository.findByIssue(issueId),
};

module.exports = activityService;
