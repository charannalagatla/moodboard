import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({ baseURL: BASE });

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 handler — clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mb_token');
      localStorage.removeItem('mb_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const register = (data)  => api.post('/auth/register', data);
export const login    = (data)  => api.post('/auth/login', data);
export const getMe    = ()      => api.get('/auth/me');

// ── Entries ───────────────────────────────────────────────────
export const createEntry   = (data)      => api.post('/entries', data);
export const getEntries    = (page = 1)  => api.get(`/entries?page=${page}&limit=20`);
export const getEntry      = (id)        => api.get(`/entries/${id}`);
export const deleteEntry   = (id)        => api.delete(`/entries/${id}`);
export const getDashboard  = ()          => api.get('/entries/dashboard');

export default api;
