const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const labelService = require('../services/labelService');

exports.list = asyncHandler(async (req, res) => {
  const labels = await labelService.list(req.params.projectId);
  success(res, { labels });
});

exports.create = asyncHandler(async (req, res) => {
  const label = await labelService.create(req.params.projectId, req.body.name);
  success(res, { label }, 201);
});

exports.attach = asyncHandler(async (req, res) => {
  const result = await labelService.attach(req.params.issueId, req.body.labelId, req.user.id);
  success(res, { result }, 201);
});

exports.detach = asyncHandler(async (req, res) => {
  await labelService.detach(req.params.issueId, req.params.labelId, req.user.id);
  success(res, { message: 'Label removed' });
});
