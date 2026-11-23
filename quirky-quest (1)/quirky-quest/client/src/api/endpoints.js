import api from './axios';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
};

export const userApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (payload) => api.put('/users/me', payload),
};

export const scoreApi = {
  submit: (payload) => api.post('/scores', payload),
  getGameLeaderboard: (game, params = {}) =>
    api.get(`/scores/leaderboard/${game}`, { params }),
  getOverallLeaderboard: (params = {}) =>
    api.get('/scores/leaderboard/overall', { params }),
};

export const gameApi = {
  list: () => api.get('/games'),
};
