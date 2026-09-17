const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const issueService = require('../services/issueService');

exports.listByProject = asyncHandler(async (req, res) => {
  const issues = await issueService.listByProject(req.params.projectId, req.query);
  success(res, { issues });
});

exports.create = asyncHandler(async (req, res) => {
  const issue = await issueService.create(req.params.projectId, req.user.id, req.body);
  success(res, { issue }, 201);
});

exports.getById = asyncHandler(async (req, res) => {
  const issue = await issueService.getById(req.params.id);
  success(res, { issue });
});

exports.update = asyncHandler(async (req, res) => {
  const issue = await issueService.update(req.params.id, req.user.id, req.body);
  success(res, { issue });
});

exports.remove = asyncHandler(async (req, res) => {
  await issueService.delete(req.params.id);
  success(res, { message: 'Issue deleted' });
});

exports.changeStatus = asyncHandler(async (req, res) => {
  const issue = await issueService.changeStatus(req.params.id, req.user.id, req.body.status);
  success(res, { issue });
});

exports.changeAssignee = asyncHandler(async (req, res) => {
  const issue = await issueService.changeAssignee(req.params.id, req.user.id, req.body.assigneeId);
  success(res, { issue });
});

exports.changePriority = asyncHandler(async (req, res) => {
  const issue = await issueService.changePriority(req.params.id, req.user.id, req.body.priority);
  success(res, { issue });
});

exports.getActivity = asyncHandler(async (req, res) => {
  const activityService = require('../services/activityService');
  const activity = await activityService.listForIssue(req.params.id);
  success(res, { activity });
});
