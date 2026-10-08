jest.mock('../src/config/db', () => ({
  $transaction: jest.fn(),
  sprint: { findMany: jest.fn() },
  projectMember: { findMany: jest.fn() },
}));
jest.mock('../src/repositories/sprintRepository', () => ({}));
jest.mock('../src/repositories/notificationRepository', () => ({ createMany: jest.fn() }));

const prisma = require('../src/config/db');
const notifications = require('../src/repositories/notificationRepository');
const sprintService = require('../src/services/sprintService');

describe('sprint scheduler rollover', () => {
  beforeEach(() => jest.clearAllMocks());

  test('completes an expired sprint and transactionally rolls incomplete issues to its next sprint', async () => {
    const sprint = { id: 'old', name: 'Sprint A', projectId: 'project', status: 'ACTIVE', project: { ownerId: 'owner' } };
    const tx = {
      sprint: {
        findUnique: jest.fn().mockResolvedValue(sprint),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findFirst: jest.fn().mockResolvedValue({ id: 'next', name: 'Sprint B' }),
      },
      issue: { findMany: jest.fn().mockResolvedValue([{ id: 'todo' }, { id: 'review' }]), updateMany: jest.fn() },
      issueSprint: { deleteMany: jest.fn(), createMany: jest.fn() },
      activity: { createMany: jest.fn() },
      sprintActivity: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation((callback) => callback(tx));
    prisma.sprint.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'old' }]);
    prisma.projectMember.findMany.mockResolvedValue([{ userId: 'member' }]);

    await sprintService.processDueSprints(new Date('2026-10-01T00:00:00Z'));

    expect(tx.issue.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: { not: 'DONE' } }) }));
    expect(tx.issue.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ sprintId: 'old' }), data: { sprintId: 'next' } }));
    expect(tx.issueSprint.createMany).toHaveBeenCalledWith({ data: [{ issueId: 'todo', sprintId: 'next' }, { issueId: 'review', sprintId: 'next' }] });
    expect(tx.activity.createMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.arrayContaining([expect.objectContaining({ action: 'SPRINT_ISSUE_ROLLOVER', newValue: 'Sprint B' })]) }));
    expect(tx.sprintActivity.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'SPRINT_COMPLETED' }) }));
    expect(notifications.createMany).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ type: 'SPRINT_COMPLETED', userId: 'member' })]));
  });
});
