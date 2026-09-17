import axiosClient from './axiosClient';

export const projectApi = {
  list: () => axiosClient.get('/projects').then((r) => r.data.data.projects),
  get: (id) => axiosClient.get(`/projects/${id}`).then((r) => r.data.data.project),
  create: (data) => axiosClient.post('/projects', data).then((r) => r.data.data.project),
  update: (id, data) => axiosClient.put(`/projects/${id}`, data).then((r) => r.data.data.project),
  archive: (id) => axiosClient.patch(`/projects/${id}/archive`).then((r) => r.data.data.project),
  remove: (id) => axiosClient.delete(`/projects/${id}`),
  members: (id) => axiosClient.get(`/projects/${id}/members`).then((r) => r.data.data.members),
  addMember: (id, data) => axiosClient.post(`/projects/${id}/members`, data).then((r) => r.data.data.member),
  updateMember: (id, userId, projectRole) => axiosClient.patch(`/projects/${id}/members/${userId}`, { projectRole }).then((r) => r.data.data.member),
  removeMember: (id, userId) => axiosClient.delete(`/projects/${id}/members/${userId}`),
};
