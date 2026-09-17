const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const issueService = require('../services/issueService');

exports.getBoard = asyncHandler(async (req, res) => {
  const issues = await issueService.getBoard(req.params.projectId);
  success(res, { issues });
});

exports.getBacklog = asyncHandler(async (req, res) => {
  const issues = await issueService.getBacklog(req.params.projectId);
  success(res, { issues });
});
