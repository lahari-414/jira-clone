const sprintRepository = require('../repositories/sprintRepository');
const notificationRepository = require('../repositories/notificationRepository');
const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

// Valid sprint state transitions
const TRANSITIONS = {
  PLANNED: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

function assertTransition(from, to) {
  if (!TRANSITIONS[from]?.includes(to)) {
    throw ApiError.badRequest(`Cannot move sprint from ${from} to ${to}`);
  }
}

const sprintService = {
  list: (projectId) => sprintRepository.findByProject(projectId),

  create: (projectId, data) => {
    const allowed = (({ name, goal, startDate, endDate }) => ({
      name,
      goal,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    }))(data);
    return sprintRepository.create({ ...allowed, projectId });
  },

  getById: async (id) => {
    const sprint = await sprintRepository.findById(id);
    if (!sprint) throw ApiError.notFound('Sprint not found');
    const total = sprint.issues.length;
    const completed = sprint.issues.filter((i) => i.status === 'DONE').length;
    return {
      ...sprint,
      progress: total === 0 ? 0 : Math.round((completed / total) * 100),
      totalIssues: total,
      completedIssues: completed,
    };
  },

  update: (id, data) => {
    const allowed = (({ name, goal, startDate, endDate }) => ({
      name,
      goal,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    }))(data);
    Object.keys(allowed).forEach((k) => allowed[k] === undefined && delete allowed[k]);
    return sprintRepository.update(id, allowed);
  },

  start: async (id) => {
    const sprint = await sprintRepository.findById(id);
    if (!sprint) throw ApiError.notFound('Sprint not found');
    assertTransition(sprint.status, 'ACTIVE');

    const existingActive = await sprintRepository.findActiveByProject(sprint.projectId);
    if (existingActive) throw ApiError.conflict('This project already has an active sprint');

    const updated = await sprintRepository.update(id, { status: 'ACTIVE' });

    const members = await prisma.projectMember.findMany({ where: { projectId: sprint.projectId } });
    await notificationRepository.createMany(
      members.map((m) => ({
        userId: m.userId,
        type: 'SPRINT_STARTED',
        title: 'Sprint started',
        message: `Sprint "${sprint.name}" has started`,
      }))
    );
    return updated;
  },

  complete: async (id) => {
    const sprint = await sprintRepository.findById(id);
    if (!sprint) throw ApiError.notFound('Sprint not found');
    assertTransition(sprint.status, 'COMPLETED');

    const updated = await sprintRepository.update(id, { status: 'COMPLETED' });
    const members = await prisma.projectMember.findMany({ where: { projectId: sprint.projectId } });
    await notificationRepository.createMany(
      members.map((m) => ({
        userId: m.userId,
        type: 'SPRINT_COMPLETED',
        title: 'Sprint completed',
        message: `Sprint "${sprint.name}" has been completed`,
      }))
    );
    return updated;
  },

  cancel: async (id) => {
    const sprint = await sprintRepository.findById(id);
    if (!sprint) throw ApiError.notFound('Sprint not found');
    assertTransition(sprint.status, 'CANCELLED');
    return sprintRepository.update(id, { status: 'CANCELLED' });
  },
};

module.exports = sprintService;
