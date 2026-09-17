const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const projectService = require('../services/projectService');

exports.list = asyncHandler(async (req, res) => {
  const projects = await projectService.list(req.user);
  success(res, { projects });
});

exports.create = asyncHandler(async (req, res) => {
  const project = await projectService.create(req.user.id, req.body);
  success(res, { project }, 201);
});

exports.getById = asyncHandler(async (req, res) => {
  const project = await projectService.getById(req.params.id);
  success(res, { project });
});

exports.update = asyncHandler(async (req, res) => {
  const project = await projectService.update(req.params.id, req.body);
  success(res, { project });
});

exports.archive = asyncHandler(async (req, res) => {
  const project = await projectService.archive(req.params.id);
  success(res, { project });
});

exports.remove = asyncHandler(async (req, res) => {
  await projectService.delete(req.params.id);
  success(res, { message: 'Project deleted' });
});

exports.listMembers = asyncHandler(async (req, res) => {
  const members = await projectService.listMembers(req.params.id);
  success(res, { members });
});

exports.addMember = asyncHandler(async (req, res) => {
  const member = await projectService.addMember(req.params.id, req.body.userId, req.body.projectRole);
  success(res, { member }, 201);
});

exports.removeMember = asyncHandler(async (req, res) => {
  await projectService.removeMember(req.params.id, req.params.userId);
  success(res, { message: 'Member removed' });
});

exports.updateMember = asyncHandler(async (req, res) => {
  const member = await projectService.updateMember(req.params.id, req.params.userId, req.body.projectRole);
  success(res, { member });
});
