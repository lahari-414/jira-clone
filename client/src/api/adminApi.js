import axiosClient from './axiosClient';

export const adminApi = {
  stats: () => axiosClient.get('/admin/stats').then((r) => r.data.data),
  auditLog: () => axiosClient.get('/admin/audit-logs').then((r) => r.data.data.log),
};
