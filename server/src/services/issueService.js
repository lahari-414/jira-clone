const issueRepository = require('../repositories/issueRepository');
const activityService = require('./activityService');
const notificationService = require('./notificationService');
const { sendForRecipients } = require('./emailService');
const { formatIssueKey } = require('../utils/issueKey');
const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

function withKey(issue) {
  if (!issue) return issue;
  return { ...issue, key: formatIssueKey(issue.project.key, issue.issueNumber), sprints: (issue.sprintLinks || []).map((link) => link.sprint) };
}
function notifyIssue(issue, event, recipients) { return sendForRecipients({ issue: withKey(issue), event, recipients }).catch(() => null); }
async function validateSprints(projectId, sprintIds = []) {
  const ids = [...new Set(sprintIds.filter(Boolean))];
  if (!ids.length) return [];
  if (await prisma.sprint.count({ where: { projectId, id: { in: ids } } }) !== ids.length) throw ApiError.badRequest('Every selected sprint must belong to this project');
  return ids;
}

const issueService = {
  async create(projectId, reporterId, data) {
    const sprintIds = await validateSprints(projectId, data.sprintIds || (data.sprintId ? [data.sprintId] : []));
    const status = data.status || 'TODO'; const now = new Date();
    const issue = await issueRepository.createForProject(projectId, {
      title: data.title, description: data.description, issueType: data.issueType, priority: data.priority, status, reporterId,
      assigneeId: data.assigneeId || null, assignedById: data.assigneeId ? reporterId : null, assignedAt: data.assigneeId ? now : null,
      sprintId: sprintIds[0] || null, sprintLinks: { create: sprintIds.map((sprintId) => ({ sprintId })) }, dueDate: data.dueDate ? new Date(data.dueDate) : null,
      startedAt: status === 'IN_PROGRESS' ? now : null, completedAt: status === 'DONE' ? now : null,
      completedById: status === 'DONE' ? reporterId : null, statusChangedAt: now,
    });
    await activityService.log({ issueId: issue.id, userId: reporterId, action: 'ISSUE_CREATED', newValue: status });
    if (issue.assigneeId) await activityService.log({ issueId: issue.id, userId: reporterId, action: 'ISSUE_ASSIGNED', newValue: issue.assignee.name });
    notifyIssue(issue, 'Work Created', [issue.reporter]);
    if (issue.assignee) {
      await notificationService.notify({ userId: issue.assigneeId, type: 'ASSIGNED', title: 'Work assigned to you', message: `${withKey(issue).key}: ${issue.title}`, issueId: issue.id });
      notifyIssue(issue, 'Work Assigned', [issue.assignee]);
    }
    return withKey(issue);
  },
  async getById(id) { const issue = await issueRepository.findById(id); if (!issue) throw ApiError.notFound('Issue not found'); return withKey(issue); },
  async listByProject(projectId, filters = {}) {
    const where = {}; ['status', 'assigneeId', 'issueType', 'priority', 'reporterId', 'assignedById'].forEach((key) => { if (filters[key]) where[key] = filters[key]; });
    if (filters.sprintId) where.sprintLinks = { some: { sprintId: filters.sprintId } };
    return (await issueRepository.findManyByProject(projectId, where)).map(withKey);
  },
  async getBoard(projectId) { return (await issueRepository.findBoardIssues(projectId)).map(withKey); },
  async getBacklog(projectId) { return (await issueRepository.findBacklogIssues(projectId)).map(withKey); },
  async update(id, userId, data) {
    const before = await issueRepository.findById(id); if (!before) throw ApiError.notFound('Issue not found'); const allowed = {};
    ['title', 'description', 'issueType', 'priority'].forEach((key) => { if (data[key] !== undefined) allowed[key] = data[key]; });
    if (data.dueDate !== undefined) allowed.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.sprintIds !== undefined) { const ids = await validateSprints(before.projectId, data.sprintIds); allowed.sprintId = ids[0] || null; allowed.sprintLinks = { deleteMany: {}, create: ids.map((sprintId) => ({ sprintId })) }; }
    const issue = await issueRepository.update(id, allowed); await activityService.log({ issueId: id, userId, action: 'ISSUE_UPDATED' });
    const otherImportantFieldsChanged = ['title', 'description', 'issueType'].some((field) => data[field] !== undefined && data[field] !== before[field]);
    if (otherImportantFieldsChanged) notifyIssue(issue, 'Issue Updated', [issue.assignee, issue.reporter, issue.assignedBy]);
    if (data.priority !== undefined && data.priority !== before.priority) { await activityService.log({ issueId: id, userId, action: 'PRIORITY_CHANGED', oldValue: before.priority, newValue: data.priority }); notifyIssue(issue, 'Priority Changed', [issue.assignee, issue.reporter, issue.assignedBy]); }
    if (data.sprintIds !== undefined) { await activityService.log({ issueId: id, userId, action: 'SPRINTS_UPDATED', oldValue: before.sprintLinks.map((x) => x.sprint.name).join(', ') || 'None', newValue: issue.sprintLinks.map((x) => x.sprint.name).join(', ') || 'None' }); notifyIssue(issue, 'Sprint Updated', [issue.assignee, issue.reporter, issue.assignedBy]); }
    return withKey(issue);
  },
  async changeStatus(id, userId, status) {
    const before = await issueRepository.findById(id); if (!before) throw ApiError.notFound('Issue not found'); if (before.status === status) return withKey(before);
    const now = new Date(); const data = { status, statusChangedAt: now }; if (status === 'IN_PROGRESS' && !before.startedAt) data.startedAt = now; if (status === 'DONE') { data.completedAt = now; data.completedById = userId; }
    const issue = await issueRepository.update(id, data); await activityService.log({ issueId: id, userId, action: 'STATUS_CHANGED', oldValue: before.status, newValue: status });
    if (status === 'IN_PROGRESS' && !before.startedAt) await activityService.log({ issueId: id, userId, action: 'WORK_STARTED' }); if (status === 'DONE') await activityService.log({ issueId: id, userId, action: 'ISSUE_COMPLETED' });
    const event = status === 'DONE' ? 'Work Completed' : status === 'BLOCKED' ? 'Work Blocked' : status === 'ON_HOLD' ? 'Work On Hold' : status === 'IN_PROGRESS' ? 'Work Started' : 'Status Changed';
    await notificationService.notify({ userId: issue.assigneeId, type: 'STATUS_CHANGED', title: event, message: `${withKey(issue).key} moved to ${status.replaceAll('_', ' ')}`, issueId: id }); notifyIssue(issue, event, [issue.assignee, issue.reporter, issue.assignedBy]); return withKey(issue);
  },
  async changeAssignee(id, userId, assigneeId) {
    const before = await issueRepository.findById(id); if (!before) throw ApiError.notFound('Issue not found'); const issue = await issueRepository.update(id, { assigneeId: assigneeId || null, ...(assigneeId ? { assignedById: userId, assignedAt: new Date() } : {}) });
    const reassigned = Boolean(before.assigneeId && assigneeId && before.assigneeId !== assigneeId); await activityService.log({ issueId: id, userId, action: reassigned ? 'ISSUE_REASSIGNED' : 'ISSUE_ASSIGNED', oldValue: before.assignee?.name || 'Unassigned', newValue: issue.assignee?.name || 'Unassigned' });
    if (assigneeId) await notificationService.notify({ userId: assigneeId, type: reassigned ? 'REASSIGNED' : 'ASSIGNED', title: reassigned ? 'Issue reassigned to you' : 'Work assigned to you', message: `${withKey(issue).key}: ${issue.title}`, issueId: id }); notifyIssue(issue, reassigned ? 'Work Reassigned' : 'Work Assigned', [issue.assignee, issue.reporter, issue.assignedBy]); return withKey(issue);
  },
  async changePriority(id, userId, priority) { const before = await issueRepository.findById(id); if (!before) throw ApiError.notFound('Issue not found'); const issue = await issueRepository.update(id, { priority }); await activityService.log({ issueId: id, userId, action: 'PRIORITY_CHANGED', oldValue: before.priority, newValue: priority }); notifyIssue(issue, 'Priority Changed', [issue.assignee, issue.reporter, issue.assignedBy]); return withKey(issue); },
  delete: (id) => issueRepository.delete(id),
};
module.exports = issueService;
