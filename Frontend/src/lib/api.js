import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim();

if (!API_BASE_URL) {
  throw new Error('Missing VITE_API_URL. Set it in Frontend/.env or Vercel env variables.');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => {
    if (
      res?.data &&
      typeof res.data === 'object' &&
      res.data.success === true &&
      Object.prototype.hasOwnProperty.call(res.data, 'data')
    ) {
      // Keep frontend pages simple by unwrapping standardized API payloads.
      res.data = res.data.data;
    }
    return res;
  },
  (err) => {
    const url = err?.config?.url || '';
    const isAuthRequest = (
      url.includes('/auth/login')
      || url.includes('/auth/register')
      || url.includes('/auth/me')
      || url.includes('/auth/logout')
    );
    if (err.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => api.post('/auth/logout'),
  me:       ()     => api.get('/auth/me'),
};

export const transactionsAPI = {
  getAll:  (params) => api.get('/transactions', { params }),
  getOne:  (id)     => api.get(`/transactions/${id}`),
  create:  (data)   => api.post('/transactions', data),
  update:  (id, d)  => api.put(`/transactions/${id}`, d),
  remove:  (id)     => api.delete(`/transactions/${id}`),
};

export const dashboardAPI = {
  summary:    ()       => api.get('/dashboard/summary'),
  recent:     (params) => api.get('/dashboard/recent', { params }),
  byCategory: ()       => api.get('/dashboard/by-category'),
  trends:     (params) => api.get('/dashboard/trends', { params }),
};

export const usersAPI = {
  getAll:       (params)   => api.get('/users', { params }),
  updateRole:   (id, role) => api.patch(`/users/${id}/role`, { role }),
  updateStatus: (id, val)  => api.patch(`/users/${id}/status`, { isActive: val }),
};
