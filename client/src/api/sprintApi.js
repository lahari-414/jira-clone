import axiosClient from './axiosClient';

export const sprintApi = {
  listByProject: (projectId) => axiosClient.get(`/projects/${projectId}/sprints`).then((r) => r.data.data.sprints),
  backlog: (projectId) => axiosClient.get(`/projects/${projectId}/sprint-backlog`).then((r) => r.data.data),
  board: (projectId, sprintId) => axiosClient.get(`/projects/${projectId}/sprint-board/${sprintId}`).then((r) => r.data.data.issues),
  create: (projectId, data) => axiosClient.post(`/projects/${projectId}/sprints`, data).then((r) => r.data.data.sprint),
  get: (id) => axiosClient.get(`/sprints/${id}`).then((r) => r.data.data.sprint),
  start: (id) => axiosClient.post(`/sprints/${id}/start`).then((r) => r.data.data.sprint),
  complete: (id) => axiosClient.post(`/sprints/${id}/complete`).then((r) => r.data.data.sprint),
  cancel: (id) => axiosClient.post(`/sprints/${id}/cancel`).then((r) => r.data.data.sprint),
};
