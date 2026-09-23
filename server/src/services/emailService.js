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
  return (issue.sprintLinks || []).map(({ sprint }) => sprint.name).join(', ') || 'No sprint';
}

function bodyFor(event, issue) {
  return `${event}\n\nIssue: ${issue.key}\nTitle: ${issue.title}\nProject: ${issue.project.name}\nPriority: ${issue.priority}\nStatus: ${issue.status.replaceAll('_', ' ')}\n\nReported By: ${issue.reporter.name}\nAssigned By: ${issue.assignedBy?.name || 'Unassigned'}\nAssigned To: ${issue.assignee?.name || 'Unassigned'}\nSprint: ${sprintNames(issue)}\n\nOpen AmiVel PMS to view the complete issue details.`;
}

async function sendForRecipients({ issue, event, recipients }) {
  const unique = [...new Map(recipients.filter(Boolean).map((u) => [u.email, u])).values()];
  const subject = `${event} – ${issue.key}`;
  await Promise.all(unique.map(async (user) => {
    const eventKey = `${issue.id}:${event}:${issue.updatedAt.toISOString()}:${user.email}`;
    try {
      const record = await prisma.emailNotification.create({ data: { issueId: issue.id, userId: user.id, event, recipientEmail: user.email, subject, eventKey } });
      const smtp = getTransport();
      if (!smtp) {
        return prisma.emailNotification.update({ where: { id: record.id }, data: { status: 'QUEUED' } });
      }
      await smtp.sendMail({ from: env.mailFrom, to: user.email, subject, text: bodyFor(event, issue) });
      return prisma.emailNotification.update({ where: { id: record.id }, data: { status: 'SENT', sentAt: new Date() } });
    } catch (error) {
      // A duplicate event is safe to ignore. Other failures remain auditable.
      if (error.code === 'P2002') return null;
      return prisma.emailNotification.create({ data: { issueId: issue.id, userId: user.id, event, recipientEmail: user.email, subject, status: 'FAILED', error: error.message, eventKey: `${eventKey}:failed` } }).catch(() => null);
    }
  }));
}

module.exports = { sendForRecipients };
