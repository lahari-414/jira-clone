import axiosClient from './axiosClient';

export const authApi = {
  register: (data) => axiosClient.post('/auth/register', data).then((r) => r.data.data),
  login: (data) => axiosClient.post('/auth/login', data).then((r) => r.data.data),
  me: () => axiosClient.get('/auth/me').then((r) => r.data.data.user),
  updateProfile: (data) => axiosClient.put('/auth/profile', data).then((r) => r.data.data.user),
  changePassword: (data) => axiosClient.put('/auth/password', data).then((r) => r.data.data),
};
