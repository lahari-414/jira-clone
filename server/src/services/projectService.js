const projectRepository = require('../repositories/projectRepository');
const notificationService = require('./notificationService');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');

const projectService = {
  async list(user) {
    return projectRepository.findManyForUser(user.id, user.role);
  },

  async create(ownerId, { name, key, description }) {
    const existing = await projectRepository.findByKey(key.toUpperCase());
    if (existing) throw ApiError.conflict(`Project key "${key}" is already in use`);

    const project = await projectRepository.create({
      name,
      key: key.toUpperCase(),
      description,
      ownerId,
    });
    await projectRepository.addMember(project.id, ownerId, 'OWNER');
    return project;
  },

  async getById(id) {
    const project = await projectRepository.findByIdWithDetails(id);
    if (!project) throw ApiError.notFound('Project not found');
    return project;
  },

  async update(id, data) {
    const allowed = (({ name, description }) => ({ name, description }))(data);
    return projectRepository.update(id, allowed);
  },

  async archive(id) {
    const project = await this.getById(id);
    const archived = await projectRepository.archive(id);
    const admins = await userRepository.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
    const recipients = new Set([project.ownerId, ...project.members.map((member) => member.userId), ...admins.map((admin) => admin.id)]);
    await Promise.all([...recipients].map((userId) => notificationService.notify({
      userId,
      type: 'PROJECT_COMPLETED',
      title: 'Project completed',
      message: `${project.name} (${project.key}) has been marked complete and archived.`,
    })));
    return archived;
  },

  async delete(id) {
    return projectRepository.delete(id);
  },

  async addMember(projectId, userId, projectRole = 'MEMBER') {
    const existing = await projectRepository.findMembership(projectId, userId);
    if (existing) throw ApiError.conflict('User is already a member of this project');
    return projectRepository.addMember(projectId, userId, projectRole);
  },

  async removeMember(projectId, userId) {
    return projectRepository.removeMember(projectId, userId);
  },

  async updateMember(projectId, userId, projectRole) {
    if (!['MANAGER', 'MEMBER', 'VIEWER'].includes(projectRole)) throw ApiError.badRequest('Invalid project role');
    return projectRepository.updateMember(projectId, userId, projectRole);
  },

  async listMembers(projectId) {
    return projectRepository.listMembers(projectId);
  },
};

module.exports = projectService;
