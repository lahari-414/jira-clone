const prisma = require('../config/db');

const labelRepository = {
  create: (data) => prisma.label.create({ data }),
  findByProject: (projectId) => prisma.label.findMany({ where: { projectId } }),
  attachToIssue: (issueId, labelId) => prisma.issueLabel.create({ data: { issueId, labelId } }),
  detachFromIssue: (issueId, labelId) =>
    prisma.issueLabel.delete({ where: { issueId_labelId: { issueId, labelId } } }),
};

module.exports = labelRepository;
