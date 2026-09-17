// Seeds the database with development-only sample data.
// Run with: npm run seed  (after migrations have been applied)
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function hash(pw) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log('Seeding database...');

  const password = await hash('Password123!');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { name: 'Ava Admin', email: 'admin@example.com', passwordHash: password, role: 'ADMIN' },
  });

  const pm = await prisma.user.upsert({
    where: { email: 'pm@example.com' },
    update: {},
    create: { name: 'Priya Manager', email: 'pm@example.com', passwordHash: password, role: 'PROJECT_MANAGER' },
  });

  const dev = await prisma.user.upsert({
    where: { email: 'dev@example.com' },
    update: {},
    create: { name: 'Diego Developer', email: 'dev@example.com', passwordHash: password, role: 'DEVELOPER' },
  });

  const tester = await prisma.user.upsert({
    where: { email: 'tester@example.com' },
    update: {},
    create: { name: 'Tara Tester', email: 'tester@example.com', passwordHash: password, role: 'TESTER' },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@example.com' },
    update: {},
    create: { name: 'Victor Viewer', email: 'viewer@example.com', passwordHash: password, role: 'VIEWER' },
  });

  const project = await prisma.project.upsert({
    where: { key: 'PROJ' },
    update: {},
    create: {
      name: 'Atlas Platform Rebuild',
      key: 'PROJ',
      description: 'Core platform modernization project',
      ownerId: pm.id,
      members: {
        create: [
          { userId: pm.id, projectRole: 'OWNER' },
          { userId: dev.id, projectRole: 'MEMBER' },
          { userId: tester.id, projectRole: 'MEMBER' },
          { userId: viewer.id, projectRole: 'VIEWER' },
        ],
      },
    },
  });

  const sprint = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 1',
      goal: 'Ship authentication and project CRUD',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  const label = await prisma.label.create({ data: { name: 'backend', projectId: project.id } });

  const issue1 = await prisma.issue.create({
    data: {
      projectId: project.id,
      issueNumber: 1,
      title: 'Implement JWT authentication',
      description: 'Add register/login endpoints with bcrypt + JWT.',
      issueType: 'STORY',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      reporterId: pm.id,
      assigneeId: dev.id,
      sprintId: sprint.id,
      labels: { create: [{ labelId: label.id }] },
    },
  });

  await prisma.issue.create({
    data: {
      projectId: project.id,
      issueNumber: 2,
      title: 'Fix Kanban drag-and-drop status revert bug',
      description: 'Card should revert to original column if the API call fails.',
      issueType: 'BUG',
      status: 'TODO',
      priority: 'MEDIUM',
      reporterId: tester.id,
      assigneeId: dev.id,
      sprintId: sprint.id,
    },
  });

  await prisma.issue.create({
    data: {
      projectId: project.id,
      issueNumber: 3,
      title: 'Design project settings page',
      issueType: 'TASK',
      status: 'BACKLOG',
      priority: 'LOW',
      reporterId: pm.id,
    },
  });

  await prisma.comment.create({
    data: { issueId: issue1.id, authorId: pm.id, content: 'Please make sure refresh tokens are considered.' },
  });

  await prisma.activity.create({
    data: { issueId: issue1.id, userId: pm.id, action: 'ISSUE_CREATED' },
  });

  console.log('Seed complete.');
  console.log('Development login credentials (do NOT use in production):');
  console.log('  admin@example.com / Password123!  (ADMIN)');
  console.log('  pm@example.com    / Password123!  (PROJECT_MANAGER)');
  console.log('  dev@example.com   / Password123!  (DEVELOPER)');
  console.log('  tester@example.com/ Password123!  (TESTER)');
  console.log('  viewer@example.com/ Password123!  (VIEWER)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
