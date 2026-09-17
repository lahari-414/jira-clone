const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const notificationService = require('../services/notificationService');

exports.list = asyncHandler(async (req, res) => {
  const result = await notificationService.list(req.user.id);
  success(res, result);
});

exports.markRead = asyncHandler(async (req, res) => {
  await notificationService.markRead(req.params.id, req.user.id);
  success(res, { message: 'Marked as read' });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user.id);
  success(res, { message: 'All notifications marked as read' });
});
