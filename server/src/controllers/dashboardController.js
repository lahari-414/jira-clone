const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const dashboardService = require('../services/dashboardService');

exports.getSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getSummary(req.user);
  success(res, summary);
});
