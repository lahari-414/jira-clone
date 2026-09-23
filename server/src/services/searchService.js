const issueRepository = require('../repositories/issueRepository');
const { formatIssueKey } = require('../utils/issueKey');

const searchService = {
  async searchIssues(user, params) {
    const { q, status, priority, issueType, projectId, assigneeId, reporterId, assignedById, sprintId, label } = params;

    const where = { AND: [] };

    // Restrict to projects the user can see, unless they're an admin
    if (user.role !== 'ADMIN') {
      where.AND.push({ project: { members: { some: { userId: user.id } } } });
    }
    if (projectId) where.AND.push({ projectId });
    if (status) where.AND.push({ status });
    if (priority) where.AND.push({ priority });
    if (issueType) where.AND.push({ issueType });
    if (assigneeId) where.AND.push({ assigneeId });
    if (reporterId) where.AND.push({ reporterId });
    if (assignedById) where.AND.push({ assignedById });
    if (sprintId) where.AND.push({ sprintLinks: { some: { sprintId } } });
    if (label) where.AND.push({ labels: { some: { label: { name: label } } } });
    if (q) {
      where.AND.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { project: { name: { contains: q, mode: 'insensitive' } } },
          { reporter: { name: { contains: q, mode: 'insensitive' } } },
          { assignee: { name: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }

    const issues = await issueRepository.search(where);
    return issues.map((issue) => ({ ...issue, key: formatIssueKey(issue.project.key, issue.issueNumber) }));
  },
};

module.exports = searchService;
