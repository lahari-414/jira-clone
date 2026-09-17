const issueRepository = require('../repositories/issueRepository');
const projectRepository = require('../repositories/projectRepository');
const activityService = require('./activityService');
const notificationService = require('./notificationService');
const { formatIssueKey } = require('../utils/issueKey');
const ApiError = require('../utils/ApiError');

// Attaches a human-readable "key" (e.g. PROJ-14) to an issue payload
function withKey(issue) {
  if (!issue) return issue;
  return { ...issue, key: formatIssueKey(issue.project.key, issue.issueNumber) };
}

const issueService = {
  async create(projectId, reporterId, data) {
    const allowed = (({ title, description, issueType, priority, status, assigneeId, sprintId, dueDate }) => ({
      title,
      description,
      issueType,
      priority,
      status: status || 'TODO',
      assigneeId: assigneeId || null,
      sprintId: sprintId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    }))(data);

    const issue = await issueRepository.createForProject(projectId, { ...allowed, reporterId });

    await activityService.log({ issueId: issue.id, userId: reporterId, action: 'ISSUE_CREATED' });

    if (issue.assigneeId && issue.assigneeId !== reporterId) {
      await notificationService.notify({
        userId: issue.assigneeId,
        type: 'ASSIGNED',
        title: 'New issue assigned to you',
        message: `You were assigned to ${formatIssueKey(issue.project.key, issue.issueNumber)}: ${issue.title}`,
        issueId: issue.id,
      });
    }

    return withKey(issue);
  },

  async getById(id) {
    const issue = await issueRepository.findById(id);
    if (!issue) throw ApiError.notFound('Issue not found');
    return withKey(issue);
  },

  async listByProject(projectId, filters = {}) {
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.sprintId) where.sprintId = filters.sprintId;
    if (filters.issueType) where.issueType = filters.issueType;
    const issues = await issueRepository.findManyByProject(projectId, where);
    return issues.map(withKey);
  },

  async getBoard(projectId) {
    const issues = await issueRepository.findBoardIssues(projectId);
    return issues.map(withKey);
  },

  async getBacklog(projectId) {
    const issues = await issueRepository.findBacklogIssues(projectId);
    return issues.map(withKey);
  },

  async update(id, userId, data) {
    const before = await issueRepository.findById(id);
    if (!before) throw ApiError.notFound('Issue not found');

    const allowed = (({ title, description, issueType, priority, dueDate }) => ({
      title,
      description,
      issueType,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    }))(data);
    Object.keys(allowed).forEach((k) => allowed[k] === undefined && delete allowed[k]);

    const issue = await issueRepository.update(id, allowed);
    await activityService.log({ issueId: id, userId, action: 'ISSUE_UPDATED' });
    return withKey(issue);
  },

  async changeStatus(id, userId, status) {
    const before = await issueRepository.findById(id);
    if (!before) throw ApiError.notFound('Issue not found');

    const issue = await issueRepository.update(id, { status });
    await activityService.log({
      issueId: id,
      userId,
      action: 'STATUS_CHANGED',
      oldValue: before.status,
      newValue: status,
    });

    if (issue.assigneeId && issue.assigneeId !== userId) {
      await notificationService.notify({
        userId: issue.assigneeId,
        type: 'STATUS_CHANGED',
        title: 'Issue status changed',
        message: `${formatIssueKey(issue.project.key, issue.issueNumber)} moved to ${status.replace('_', ' ')}`,
        issueId: id,
      });
    }
    return withKey(issue);
  },

  async changeAssignee(id, userId, assigneeId) {
    const before = await issueRepository.findById(id);
    if (!before) throw ApiError.notFound('Issue not found');

    const issue = await issueRepository.update(id, { assigneeId: assigneeId || null });
    await activityService.log({
      issueId: id,
      userId,
      action: 'ASSIGNEE_CHANGED',
      oldValue: before.assignee?.name || 'Unassigned',
      newValue: issue.assignee?.name || 'Unassigned',
    });

    if (assigneeId && assigneeId !== userId) {
      await notificationService.notify({
        userId: assigneeId,
        type: 'ASSIGNED',
        title: 'You were assigned to an issue',
        message: `${formatIssueKey(issue.project.key, issue.issueNumber)}: ${issue.title}`,
        issueId: id,
      });
    }
    return withKey(issue);
  },

  async changePriority(id, userId, priority) {
    const before = await issueRepository.findById(id);
    if (!before) throw ApiError.notFound('Issue not found');

    const issue = await issueRepository.update(id, { priority });
    await activityService.log({
      issueId: id,
      userId,
      action: 'PRIORITY_CHANGED',
      oldValue: before.priority,
      newValue: priority,
    });
    return withKey(issue);
  },

  async delete(id) {
    return issueRepository.delete(id);
  },
};

module.exports = issueService;
