const prisma = require('../config/db');
const env = require('../config/env');

// SMTP is deliberately optional in local development; every attempt is still persisted.
let transport;
function getTransport() {
  if (!env.smtpUrl) return null;
  if (!transport) transport = require('nodemailer').createTransport(env.smtpUrl);
  return transport;
}

function sprintNames(issue) {
  return (issue.sprintLinks || []).map(({ sprint }) => {
    const start = sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : 'No start date';
    const end = sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : 'No end date';
    return `${sprint.name} (${start} – ${end})`;
  }).join(', ') || 'No sprint';
}

function bodyFor(event, issue) {
  const templates = {
    'Work Created': 'A new issue has been created.',
    'Work Assigned': 'An issue has been assigned to you.',
    'Work Reassigned': 'An issue assignment has changed.',
    'Work Started': 'Work on this issue has started.',
    'Work Blocked': 'This issue has been marked as blocked.',
    'Work On Hold': 'This issue has been placed on hold.',
    'Work Completed': 'This issue has been completed.',
    'Priority Changed': 'The priority for this issue has changed.',
    'Sprint Updated': 'The sprint assignment for this issue has changed.',
    'Status Changed': 'The status for this issue has changed.',
    'Issue Updated': 'Important issue details have been updated.',
  };
  const assignedAt = issue.assignedAt ? new Date(issue.assignedAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' }) : 'Not assigned';
  return `${templates[event] || 'There is an update on this issue.'}\n\nIssue: ${issue.key}\nTitle: ${issue.title}\nProject: ${issue.project.name}\nPriority: ${issue.priority}\nStatus: ${issue.status.replaceAll('_', ' ')}\n\nReported By: ${issue.reporter.name}\nAssigned By: ${issue.assignedBy?.name || 'Unassigned'}\nAssigned To: ${issue.assignee?.name || 'Unassigned'}\nSprint: ${sprintNames(issue)}\n\nAssigned Date: ${assignedAt}\n\nPlease open the Project Management System to view the complete issue details.`;
}

async function sendForRecipients({ issue, event, recipients }) {
  const projectManagers = await prisma.projectMember.findMany({
    where: { projectId: issue.projectId, OR: [{ projectRole: 'MANAGER' }, { user: { role: 'PROJECT_MANAGER' } }] },
    include: { user: true },
  });
  const project = await prisma.project.findUnique({ where: { id: issue.projectId }, include: { owner: true } });
  const allRecipients = [...recipients, project?.owner, ...projectManagers.map(({ user }) => user)].filter(Boolean);
  const unique = [...new Map(allRecipients.filter((u) => u.email).map((u) => [u.email, u])).values()];
  const subject = `${event} – ${issue.key}`;
  await Promise.all(unique.map(async (user) => {
    const eventKey = `${issue.id}:${event}:${issue.updatedAt.toISOString()}:${user.email}`;
    let record;
    try {
      record = await prisma.emailNotification.create({ data: { issueId: issue.id, userId: user.id, event, recipientEmail: user.email, subject, eventKey } });
      const smtp = getTransport();
      if (!smtp) {
        return prisma.emailNotification.update({ where: { id: record.id }, data: { status: 'QUEUED' } });
      }
      await smtp.sendMail({ from: env.mailFrom, to: user.email, subject, text: bodyFor(event, issue) });
      return prisma.emailNotification.update({ where: { id: record.id }, data: { status: 'SENT', sentAt: new Date() } });
    } catch (error) {
      // A duplicate event is safe to ignore. Other failures remain auditable.
      if (error.code === 'P2002') return null;
      if (record) return prisma.emailNotification.update({ where: { id: record.id }, data: { status: 'FAILED', error: error.message } }).catch(() => null);
      return prisma.emailNotification.create({ data: { issueId: issue.id, userId: user.id, event, recipientEmail: user.email, subject, status: 'FAILED', error: error.message, eventKey: `${eventKey}:failed` } }).catch(() => null);
    }
  }));
}

module.exports = { sendForRecipients };
