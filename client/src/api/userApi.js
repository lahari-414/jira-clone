import axiosClient from './axiosClient';

export const userApi = {
  list: (params) => axiosClient.get('/users', { params }).then((r) => r.data.data),
  create: (data) => axiosClient.post('/users', data).then((r) => r.data.data.user),
  update: (id, data) => axiosClient.put(`/users/${id}`, data).then((r) => r.data.data.user),
  setStatus: (id, isActive) => axiosClient.patch(`/users/${id}/status`, { isActive }).then((r) => r.data.data.user),
};
