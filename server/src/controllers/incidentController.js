const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const incidentService = require('../services/incidentService');
exports.list = asyncHandler(async (req, res) => success(res, { incidents: await incidentService.list(req.params.projectId) }));
exports.update = asyncHandler(async (req, res) => success(res, { incident: await incidentService.update(req.params.id, req.body) }));
