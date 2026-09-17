const ApiError = require('../utils/ApiError');
const prisma = require('../config/db');

// Ensures req.user is a member (or admin) of the :projectId in the route,
// and attaches the membership record as req.projectMembership
const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    if (!projectId) return next(ApiError.badRequest('projectId is required'));

    if (req.user.role === 'ADMIN') return next();

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });
    if (!membership) {
      return next(ApiError.forbidden('You are not a member of this project'));
    }
    req.projectMembership = membership;
    next();
  } catch (err) {
    next(err);
  }
};

// Restricts an action to project OWNER/MANAGER (or platform ADMIN)
const requireProjectManager = async (req, res, next) => {
  if (req.user.role === 'ADMIN') return next();
  const role = req.projectMembership?.projectRole;
  if (role !== 'OWNER' && role !== 'MANAGER') {
    return next(ApiError.forbidden('Only project managers can perform this action'));
  }
  next();
};

// Resolves an issue to its project before allowing standalone issue routes.
const requireIssueMember = async (req, res, next) => {
  try {
    const issueId = req.params.id || req.params.issueId;
    const issue = await prisma.issue.findUnique({ where: { id: issueId }, select: { projectId: true, assigneeId: true } });
    if (!issue) return next(ApiError.notFound('Issue not found'));
    req.params.projectId = issue.projectId;
    req.issueAccess = issue;
    return requireProjectMember(req, res, next);
  } catch (err) {
    next(err);
  }
};

const requireIssueManager = (req, res, next) => requireProjectManager(req, res, next);

const requireIssueAssigneeOrManager = (req, res, next) => {
  if (req.user.role === 'ADMIN' || req.issueAccess?.assigneeId === req.user.id) return next();
  const role = req.projectMembership?.projectRole;
  if (role === 'OWNER' || role === 'MANAGER') return next();
  return next(ApiError.forbidden('Only the assigned developer or a project manager can change this issue status'));
};

const requireCommentMember = async (req, res, next) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id }, include: { issue: { select: { projectId: true } } } });
    if (!comment) return next(ApiError.notFound('Comment not found'));
    req.params.projectId = comment.issue.projectId;
    return requireProjectMember(req, res, next);
  } catch (err) { next(err); }
};

module.exports = { requireProjectMember, requireProjectManager, requireIssueMember, requireIssueManager, requireIssueAssigneeOrManager, requireCommentMember };
