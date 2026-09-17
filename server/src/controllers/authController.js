const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const authService = require('../services/authService');
const { sanitizeUser } = require('../utils/sanitizeUser');

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  success(res, result, 201);
});

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  success(res, result);
});

exports.logout = asyncHandler(async (req, res) => {
  // Stateless JWT — logout is handled client-side by discarding the token
  success(res, { message: 'Logged out' });
});

exports.me = asyncHandler(async (req, res) => {
  success(res, { user: sanitizeUser(req.user) });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  success(res, { user });
});

exports.changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  success(res, { message: 'Password updated' });
});
