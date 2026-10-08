import axiosClient from './axiosClient';
export const ideaApi = {
  list: () => axiosClient.get('/ideas').then((r) => r.data.data.ideas),
  create: (data) => axiosClient.post('/ideas', data).then((r) => r.data.data.idea),
  comment: (id, content) => axiosClient.post(`/ideas/${id}/comments`, { content }).then((r) => r.data.data.comment),
};
