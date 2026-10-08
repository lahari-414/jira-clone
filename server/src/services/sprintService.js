const sprintRepository = require('../repositories/sprintRepository');
const notificationRepository = require('../repositories/notificationRepository');
const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

const TRANSITIONS = { FUTURE: ['ACTIVE', 'CANCELLED'], ACTIVE: ['COMPLETED', 'CANCELLED'], COMPLETED: [], CANCELLED: [] };
function assertTransition(from, to) {
  if (!TRANSITIONS[from]?.includes(to)) throw ApiError.badRequest(`Cannot move sprint from ${from} to ${to}`);
}
function dateValue(date, time) {
  if (!date) return null;
  if (date instanceof Date) return date;
  if (String(date).includes('T')) return new Date(date);
  return new Date(`${date}T${time || '00:00'}:00`);
}

async function notifyProject(projectId, type, title, message) {
  const members = await prisma.projectMember.findMany({ where: { projectId } });
  await notificationRepository.createMany(members.map(({ userId }) => ({ userId, type, title, message })));
}

async function finishSprint(sprintId, now = new Date()) {
  const result = await prisma.$transaction(async (tx) => {
    const sprint = await tx.sprint.findUnique({ where: { id: sprintId }, include: { project: true } });
    if (!sprint || !['ACTIVE', 'FUTURE'].includes(sprint.status)) return null;
    const completion = await tx.sprint.updateMany({ where: { id: sprintId, status: sprint.status }, data: { status: 'COMPLETED' } });
    if (!completion.count) return null;
    const incomplete = await tx.issue.findMany({ where: { projectId: sprint.projectId, sprintId, status: { not: 'DONE' } }, select: { id: true, title: true } });
    if (incomplete.length) {
      // Preserve the sprint link as history while clearing the current assignment.
      await tx.issue.updateMany({ where: { id: { in: incomplete.map((i) => i.id) }, sprintId }, data: { sprintId: null } });
      await tx.activity.createMany({ data: incomplete.map(({ id }) => ({ issueId: id, userId: sprint.project.ownerId, action: 'SPRINT_ISSUE_ROLLOVER', oldValue: sprint.name, newValue: 'Backlog' })) });
    }
    await tx.sprintActivity.create({ data: { sprintId, userId: sprint.project.ownerId, action: 'SPRINT_COMPLETED', details: `${incomplete.length} incomplete issues moved to project backlog` } });
    return { sprint, count: incomplete.length };
  });
  if (!result) return null;
  await notifyProject(result.sprint.projectId, 'SPRINT_COMPLETED', 'Sprint completed', `Sprint "${result.sprint.name}" completed. ${result.count} incomplete issue(s) moved to Backlog.`);
  return result;
}

const sprintService = {
  list: (projectId) => sprintRepository.findByProject(projectId),
  async backlog(projectId) {
    const [sprints, incidents] = await Promise.all([
      prisma.sprint.findMany({ where: { projectId }, orderBy: [{ createdAt: 'desc' }, { startDate: { sort: 'desc', nulls: 'last' } }], include: { incident: true, issueLinks: { include: { issue: { include: { project: true, assignee: true, reporter: true, sprintLinks: { include: { sprint: true } }, labels: { include: { label: true } }, _count: { select: { comments: true, attachments: true } } } } } } } }),
      prisma.incident.findMany({ where: { projectId }, include: { sprints: { select: { id: true, name: true, status: true, startDate: true, endDate: true } } }, orderBy: { createdAt: 'desc' } }),
    ]);
    const { formatIssueKey } = require('../utils/issueKey');
    const issueKey = (issue) => ({ ...issue, key: formatIssueKey(issue.project.key, issue.issueNumber) });
    const backlogIssues = await prisma.issue.findMany({ where: { projectId, sprintId: null, status: { not: 'DONE' } }, include: { project: true, assignee: true, reporter: true, sprintLinks: { include: { sprint: true } }, labels: { include: { label: true } }, _count: { select: { comments: true, attachments: true } } }, orderBy: { createdAt: 'desc' } });
    return { sprints: sprints.map((s) => ({ ...s, issues: s.issueLinks.map(({ issue }) => issueKey(issue)) })), incidents, backlogIssues: backlogIssues.map(issueKey) };
  },
  async create(projectId, data) {
    const startDate = dateValue(data.startDate, data.startTime);
    const endDate = dateValue(data.endDate, data.endTime);
    const name = data.name.trim();
    if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) throw ApiError.badRequest('Valid sprint start and end dates are required');
    if (startDate && endDate && endDate <= startDate) throw ApiError.badRequest('Sprint end must be after its start');
    if (endDate <= new Date()) throw ApiError.badRequest('Sprint end must be in the future');
    const duplicate = await prisma.sprint.findFirst({ where: { projectId, name: { equals: name, mode: 'insensitive' } }, select: { id: true } });
    if (duplicate) throw ApiError.conflict('A sprint with this name already exists in this project');
    return sprintRepository.create({ name, goal: data.goal || null, startDate, endDate, projectId, status: 'FUTURE' });
  },
  async getById(id) {
    const sprint = await sprintRepository.findById(id);
    if (!sprint) throw ApiError.notFound('Sprint not found');
    const issues = sprint.issueLinks.map(({ issue }) => issue);
    const total = issues.length;
    const completed = issues.filter((i) => i.status === 'DONE').length;
    return { ...sprint, issues, totalIssues: total, completedIssues: completed, inProgressIssues: issues.filter((i) => i.status === 'IN_PROGRESS').length, remainingIssues: total - completed, progress: total ? Math.round(completed / total * 100) : 0 };
  },
  async update(id, data) {
    const allowed = {};
    for (const key of ['name', 'goal']) if (data[key] !== undefined) allowed[key] = data[key];
    if (allowed.name !== undefined) allowed.name = allowed.name.trim();
    if (data.startDate !== undefined) allowed.startDate = dateValue(data.startDate, data.startTime);
    if (data.endDate !== undefined) allowed.endDate = dateValue(data.endDate, data.endTime);
    const current = await sprintRepository.findById(id);
    if (!current) throw ApiError.notFound('Sprint not found');
    if (allowed.name && allowed.name.toLowerCase() !== current.name.toLowerCase()) {
      const duplicate = await prisma.sprint.findFirst({ where: { projectId: current.projectId, id: { not: id }, name: { equals: allowed.name, mode: 'insensitive' } }, select: { id: true } });
      if (duplicate) throw ApiError.conflict('A sprint with this name already exists in this project');
    }
    if (allowed.startDate && Number.isNaN(allowed.startDate.getTime())) throw ApiError.badRequest('Invalid sprint start date');
    if (allowed.endDate && Number.isNaN(allowed.endDate.getTime())) throw ApiError.badRequest('Invalid sprint end date');
    if (allowed.startDate && (allowed.endDate || current.endDate) && (allowed.endDate || current.endDate) <= allowed.startDate) throw ApiError.badRequest('Sprint end must be after its start');
    return sprintRepository.update(id, allowed);
  },
  async start(id) {
    const sprint = await sprintRepository.findById(id);
    if (!sprint) throw ApiError.notFound('Sprint not found');
    assertTransition(sprint.status, 'ACTIVE');
    if (sprint.endDate && sprint.endDate <= new Date()) throw ApiError.badRequest('A sprint past its end time cannot be started');
    const active = await sprintRepository.findActiveByProject(sprint.projectId);
    if (active) throw ApiError.conflict('This project already has an active sprint');
    const updated = await sprintRepository.update(id, { status: 'ACTIVE' });
    await prisma.sprintActivity.create({ data: { sprintId: id, action: 'SPRINT_STARTED', details: 'Sprint started manually' } });
    await notifyProject(sprint.projectId, 'SPRINT_STARTED', 'Sprint started', `Sprint "${sprint.name}" has started`);
    return updated;
  },
  async complete(id) {
    const sprint = await sprintRepository.findById(id);
    if (!sprint) throw ApiError.notFound('Sprint not found');
    assertTransition(sprint.status, 'COMPLETED');
    await finishSprint(id);
    return sprintRepository.findById(id);
  },
  async cancel(id) {
    const sprint = await sprintRepository.findById(id);
    if (!sprint) throw ApiError.notFound('Sprint not found');
    assertTransition(sprint.status, 'CANCELLED');
    const updated = await sprintRepository.update(id, { status: 'CANCELLED' });
    await prisma.sprintActivity.create({ data: { sprintId: id, action: 'SPRINT_CANCELLED', details: 'Sprint cancelled manually' } });
    await notifyProject(sprint.projectId, 'SPRINT_UPDATED', 'Sprint cancelled', `Sprint "${sprint.name}" has been cancelled`);
    return updated;
  },
  async processDueSprints(now = new Date()) {
    const expiringBeforeStart = await prisma.sprint.findMany({ where: { status: 'ACTIVE', endDate: { lte: now } }, select: { id: true } });
    for (const sprint of expiringBeforeStart) await finishSprint(sprint.id, now);
    const starting = await prisma.sprint.findMany({ where: { status: 'FUTURE', startDate: { lte: now } }, orderBy: { startDate: 'asc' } });
    for (const sprint of starting) {
      const claimed = await prisma.$transaction(async (tx) => {
        const activeSprint = await tx.sprint.findFirst({ where: { projectId: sprint.projectId, status: 'ACTIVE' }, select: { id: true } });
        if (activeSprint) return false;
        const updated = await tx.sprint.updateMany({ where: { id: sprint.id, status: 'FUTURE' }, data: { status: 'ACTIVE' } });
        return Boolean(updated.count);
      });
      if (!claimed) continue;
      await prisma.sprintActivity.create({ data: { sprintId: sprint.id, action: 'SPRINT_STARTED', details: 'Automatically activated at configured start time' } });
      await notifyProject(sprint.projectId, 'SPRINT_STARTED', 'Sprint started', `Sprint "${sprint.name}" is now active`);
    }
    const expiring = await prisma.sprint.findMany({ where: { status: 'ACTIVE', endDate: { lte: now } }, select: { id: true } });
    for (const sprint of expiring) await finishSprint(sprint.id, now);
  },
};

module.exports = sprintService;
