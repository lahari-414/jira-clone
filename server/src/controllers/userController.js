const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const userService = require('../services/userService');

exports.list = asyncHandler(async (req, res) => {
  const result = await userService.list(req.query);
  success(res, result);
});

exports.getById = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id);
  success(res, { user });
});

exports.create = asyncHandler(async (req, res) => {
  const user = await userService.createByAdmin(req.body);
  success(res, { user }, 201);
});

exports.update = asyncHandler(async (req, res) => {
  const user = await userService.update(req.params.id, req.body);
  success(res, { user });
});

exports.setStatus = asyncHandler(async (req, res) => {
  const user = await userService.setStatus(req.params.id, req.body.isActive);
  success(res, { user });
});

exports.remove = asyncHandler(async (req, res) => {
  await userService.setDeleted(req.params.id, true);
  success(res, { message: 'User moved to deleted users' });
});

exports.restore = asyncHandler(async (req, res) => {
  const user = await userService.setDeleted(req.params.id, false);
  success(res, { user, message: 'User restored' });
});
