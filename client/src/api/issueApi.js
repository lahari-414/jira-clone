import axiosClient from './axiosClient';

export const issueApi = {
  listByProject: (projectId, params) =>
    axiosClient.get(`/projects/${projectId}/issues`, { params }).then((r) => r.data.data.issues),
  board: (projectId) => axiosClient.get(`/projects/${projectId}/board`).then((r) => r.data.data.issues),
  backlog: (projectId) => axiosClient.get(`/projects/${projectId}/backlog`).then((r) => r.data.data.issues),
  create: (projectId, data) =>
    axiosClient.post(`/projects/${projectId}/issues`, data).then((r) => r.data.data.issue),
  get: (id) => axiosClient.get(`/issues/${id}`).then((r) => r.data.data.issue),
  update: (id, data) => axiosClient.put(`/issues/${id}`, data).then((r) => r.data.data.issue),
  remove: (id) => axiosClient.delete(`/issues/${id}`),
  changeStatus: (id, status) => axiosClient.patch(`/issues/${id}/status`, { status }).then((r) => r.data.data.issue),
  changeAssignee: (id, assigneeId) =>
    axiosClient.patch(`/issues/${id}/assignee`, { assigneeId }).then((r) => r.data.data.issue),
  changePriority: (id, priority) =>
    axiosClient.patch(`/issues/${id}/priority`, { priority }).then((r) => r.data.data.issue),
  activity: (id) => axiosClient.get(`/issues/${id}/activity`).then((r) => r.data.data.activity),
  comments: (id) => axiosClient.get(`/issues/${id}/comments`).then((r) => r.data.data.comments),
  addComment: (id, content) => axiosClient.post(`/issues/${id}/comments`, { content }).then((r) => r.data.data.comment),
  attachments: (id) => axiosClient.get(`/issues/${id}/attachments`).then((r) => r.data.data.attachments),
  uploadAttachment: (id, file) => {
    const formData = new FormData(); formData.append('file', file);
    return axiosClient.post(`/issues/${id}/attachments`, formData).then((r) => r.data.data.attachment);
  },
  removeAttachment: (id, attachmentId) => axiosClient.delete(`/issues/${id}/attachments/${attachmentId}`),
  updateComment: (commentId, content) => axiosClient.put(`/comments/${commentId}`, { content }).then((r) => r.data.data.comment),
  removeComment: (commentId) => axiosClient.delete(`/comments/${commentId}`),
};
