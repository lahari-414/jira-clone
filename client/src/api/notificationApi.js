import axiosClient from './axiosClient';

export const notificationApi = {
  list: () => axiosClient.get('/notifications').then((r) => r.data.data),
  markRead: (id) => axiosClient.patch(`/notifications/${id}/read`),
  markAllRead: () => axiosClient.patch('/notifications/read-all'),
};
