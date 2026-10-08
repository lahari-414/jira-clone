const prisma = require('../config/db');
const env = require('../config/env');

// SMTP is deliberately optional in local development; every attempt is still persisted.
let transport;
function getTransport() {
  if (!env.smtpUrl && !(env.smtpUser && env.smtpPassword)) return null;
  if (!transport) {
    const nodemailer = require('nodemailer');
    transport = env.smtpUrl
      ? nodemailer.createTransport(env.smtpUrl)
      : nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort,
        secure: env.smtpSecure || env.smtpPort === 465,
        auth: { user: env.smtpUser, pass: env.smtpPassword },
      });
  }
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
  console.log('\n=================================');
  console.log('EMAIL SERVICE STARTED');
  console.log('EVENT:', event);
  console.log('ISSUE KEY:', issue?.key);
  console.log('ISSUE ID:', issue?.id);
  console.log('PROJECT:', issue?.project?.name);
  console.log('RECIPIENT CANDIDATES:');

  console.log(
    (recipients || []).map((user) => ({
      id: user?.id,
      name: user?.name,
      email: user?.email,
    }))
  );

  const projectManagers = await prisma.projectMember.findMany({
    where: {
      projectId: issue.projectId,
      OR: [
        { projectRole: 'MANAGER' },
        { user: { role: 'PROJECT_MANAGER' } },
      ],
    },
    include: {
      user: true,
    },
  });

  const project = await prisma.project.findUnique({
    where: {
      id: issue.projectId,
    },
    include: {
      owner: true,
    },
  });

  const allRecipients = [
    ...(recipients || []),
    project?.owner,
    ...projectManagers.map(({ user }) => user),
  ].filter(Boolean);

  const unique = [
    ...new Map(
      allRecipients
        .filter((user) => user?.email)
        .map((user) => [user.email.toLowerCase(), user])
    ).values(),
  ];

  console.log('FINAL EMAIL RECIPIENTS:');

  console.log(
    unique.map((user) => ({
      name: user.name,
      email: user.email,
    }))
  );

  if (!unique.length) {
    console.error('NO EMAIL RECIPIENTS FOUND');
    return;
  }

  const subject = `${event} – ${issue.key}`;

  console.log('EMAIL SUBJECT:', subject);

  const smtp = getTransport();

  if (!smtp) {
    console.error('SMTP TRANSPORT NOT AVAILABLE');
    console.error('SMTP USER:', env.smtpUser);
    console.error('SMTP HOST:', env.smtpHost);

    return;
  }

  console.log('SMTP TRANSPORT AVAILABLE');

  for (const user of unique) {
    const eventKey =
      `${issue.id}:${event}:${issue.updatedAt.toISOString()}:${user.email}`;

    let record;

    try {
      record = await prisma.emailNotification.create({
        data: {
          issueId: issue.id,
          userId: user.id,
          event,
          recipientEmail: user.email,
          subject,
          eventKey,
        },
      });

      console.log(
        `EMAIL RECORD CREATED: ${user.email}`
      );

      const info = await smtp.sendMail({
        from: env.mailFrom,
        to: user.email,
        subject,
        text: bodyFor(event, issue),
      });

      console.log('=================================');
      console.log('EMAIL SENT SUCCESSFULLY');
      console.log('TO:', user.email);
      console.log('MESSAGE ID:', info.messageId);
      console.log('RESPONSE:', info.response);
      console.log('=================================');

      await prisma.emailNotification.update({
        where: {
          id: record.id,
        },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error('=================================');
      console.error('EMAIL SEND FAILED');
      console.error('TO:', user.email);
      console.error('ERROR:', error.message);
      console.error('FULL ERROR:', error);
      console.error('=================================');

      if (error.code === 'P2002') {
        console.log(
          'Duplicate email notification skipped:',
          user.email
        );
        continue;
      }

      if (record) {
        await prisma.emailNotification
          .update({
            where: {
              id: record.id,
            },
            data: {
              status: 'FAILED',
              error: error.message,
            },
          })
          .catch(() => null);
      }
    }
  }
}
// async function sendForRecipients({ issue, event, recipients }) {
//   const projectManagers = await prisma.projectMember.findMany({
//     where: { projectId: issue.projectId, OR: [{ projectRole: 'MANAGER' }, { user: { role: 'PROJECT_MANAGER' } }] },
//     include: { user: true },
//   });
//   const project = await prisma.project.findUnique({ where: { id: issue.projectId }, include: { owner: true } });
//   const allRecipients = [...recipients, project?.owner, ...projectManagers.map(({ user }) => user)].filter(Boolean);
//   const unique = [...new Map(allRecipients.filter((u) => u.email).map((u) => [u.email, u])).values()];
//   const subject = `${event} – ${issue.key}`;
//   await Promise.all(unique.map(async (user) => {
//     const eventKey = `${issue.id}:${event}:${issue.updatedAt.toISOString()}:${user.email}`;
//     let record;
//     try {
//       record = await prisma.emailNotification.create({ data: { issueId: issue.id, userId: user.id, event, recipientEmail: user.email, subject, eventKey } });
//       const smtp = getTransport();
//       if (!smtp) {
//         return prisma.emailNotification.update({ where: { id: record.id }, data: { status: 'QUEUED' } });
//       }
//       await smtp.sendMail({ from: env.mailFrom, to: user.email, subject, text: bodyFor(event, issue) });
//       return prisma.emailNotification.update({ where: { id: record.id }, data: { status: 'SENT', sentAt: new Date() } });
//     } catch (error) {
//       // A duplicate event is safe to ignore. Other failures remain auditable.
//       if (error.code === 'P2002') return null;
//       if (record) return prisma.emailNotification.update({ where: { id: record.id }, data: { status: 'FAILED', error: error.message } }).catch(() => null);
//       return prisma.emailNotification.create({ data: { issueId: issue.id, userId: user.id, event, recipientEmail: user.email, subject, status: 'FAILED', error: error.message, eventKey: `${eventKey}:failed` } }).catch(() => null);
//     }
//   }));
// }

module.exports = { sendForRecipients };
