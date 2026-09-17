const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const savedFilterService = require('../services/savedFilterService');

exports.list = asyncHandler(async (req, res) => {
  const filters = await savedFilterService.list(req.user.id);
  success(res, { filters });
});

exports.create = asyncHandler(async (req, res) => {
  const filter = await savedFilterService.create(req.user.id, req.body.name, req.body.query);
  success(res, { filter }, 201);
});

exports.remove = asyncHandler(async (req, res) => {
  await savedFilterService.delete(req.params.id, req.user.id);
  success(res, { message: 'Saved filter deleted' });
});
