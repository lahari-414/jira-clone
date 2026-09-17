const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const sprintService = require('../services/sprintService');

exports.list = asyncHandler(async (req, res) => {
  const sprints = await sprintService.list(req.params.projectId);
  success(res, { sprints });
});

exports.create = asyncHandler(async (req, res) => {
  const sprint = await sprintService.create(req.params.projectId, req.body);
  success(res, { sprint }, 201);
});

exports.getById = asyncHandler(async (req, res) => {
  const sprint = await sprintService.getById(req.params.id);
  success(res, { sprint });
});

exports.update = asyncHandler(async (req, res) => {
  const sprint = await sprintService.update(req.params.id, req.body);
  success(res, { sprint });
});

exports.start = asyncHandler(async (req, res) => {
  const sprint = await sprintService.start(req.params.id);
  success(res, { sprint });
});

exports.complete = asyncHandler(async (req, res) => {
  const sprint = await sprintService.complete(req.params.id);
  success(res, { sprint });
});

exports.cancel = asyncHandler(async (req, res) => {
  const sprint = await sprintService.cancel(req.params.id);
  success(res, { sprint });
});
