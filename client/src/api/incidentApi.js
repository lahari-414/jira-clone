import axiosClient from './axiosClient';
export const incidentApi = {
  list: (projectId) => axiosClient.get(`/projects/${projectId}/incidents`).then((r) => r.data.data.incidents),
  update: (projectId, incidentId, data) => axiosClient.patch(`/projects/${projectId}/incidents/${incidentId}`, data).then((r) => r.data.data.incident),
};
