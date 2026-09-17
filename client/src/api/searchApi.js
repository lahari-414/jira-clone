import axiosClient from './axiosClient';

export const searchApi = {
  issues: (params) => axiosClient.get('/search/issues', { params }).then((r) => r.data.data.issues),
};
