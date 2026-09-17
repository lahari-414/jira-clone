const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const adminService = require('../services/adminService');

exports.stats = asyncHandler(async (req, res) => {
  const stats = await adminService.stats();
  success(res, stats);
});

exports.auditLog = asyncHandler(async (req, res) => {
  const log = await adminService.auditLog();
  success(res, { log });
});
