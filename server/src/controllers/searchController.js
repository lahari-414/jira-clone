const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const searchService = require('../services/searchService');

exports.searchIssues = asyncHandler(async (req, res) => {
  const issues = await searchService.searchIssues(req.user, req.query);
  success(res, { issues });
});
