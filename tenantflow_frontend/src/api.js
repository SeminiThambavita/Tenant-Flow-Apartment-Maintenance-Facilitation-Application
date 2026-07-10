import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

const ISSUE_UPDATED_EVENT = 'tenantflow:issue-updated';

const broadcastIssueUpdate = (issueId, status) => {
  if (typeof window === 'undefined') return;

  const payload = JSON.stringify({
    issueId,
    status,
    at: Date.now()
  });

  window.dispatchEvent(new CustomEvent(ISSUE_UPDATED_EVENT, {
    detail: { issueId, status }
  }));

  try {
    localStorage.setItem(ISSUE_UPDATED_EVENT, payload);
  } catch {
    // ignore storage failures
  }
};

// Add token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password, role) => api.post('/auth/login', { email, password, role }),
  tenantRegister: (data) => api.post('/auth/tenant-register', data),
  staffRegister: (data) => api.post('/auth/staff-register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
  getPendingStaff: () => api.get('/auth/staff/pending'),
  getApprovedStaff: () => api.get('/auth/staff/approved'),
  getStaffById: (id) => api.get(`/auth/staff/details/${id}`),
  getPendingStaffById: (id) => api.get(`/auth/staff/${id}`),
  updateStaffStatus: (id, status) => api.put(`/auth/staff/${id}/status`, { status }),
  getTenants: () => api.get('/auth/tenants'),
};

export const issueAPI = {
  getAll: (params) => api.get('/issues', { params }),
  getById: (id) => api.get(`/issues/${id}`),
  create: (data) => api.post('/issues', data),
  update: async (id, data) => {
    const response = await api.put(`/issues/${id}`, data);
    broadcastIssueUpdate(id, data?.status);
    return response;
  },
  delete: (id) => api.delete(`/issues/${id}`),
};

export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

export const invoiceAPI = {
  getAll: () => api.get('/invoices'),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  sendToTenant: (id) => api.post(`/invoices/${id}/send`),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
};

export const paymentAPI = {
  initiate: (data) => api.post('/payments/initiate', data),
  getAll: () => api.get('/payments'),
  getTenantPayments: () => api.get('/payments/tenant-payments'),
  getStaffPayments: () => api.get('/payments/staff-payments'),
  getByOrderId: (orderId) => api.get(`/payments/${orderId}`),
  deleteById: (id) => api.delete(`/payments/${id}`),
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications/clear-all'),
};

export const costReportAPI = {
  create: (data) => api.post('/cost-reports', data),
  getAll: (params) => api.get('/cost-reports', { params }),
  getById: (id) => api.get(`/cost-reports/${id}`),
  getByIssue: (issueId) => api.get(`/cost-reports/issue/${issueId}`),
  getPendingForManager: () => api.get('/cost-reports/manager/pending'),
  update: (id, data) => api.put(`/cost-reports/${id}`, data),
  submit: (id) => api.post(`/cost-reports/${id}/submit`),
  approve: (id, data) => api.post(`/cost-reports/${id}/approve`, data),
  reject: (id, data) => api.post(`/cost-reports/${id}/reject`, data),
  delete: (id) => api.delete(`/cost-reports/${id}`),
};

export const ai = {
  getSuggestions: (issueId) => api.get(`/ai/suggestions/${issueId}`),
  analyzeIssue: (data) => api.post('/ai/analyze', data),
};

export const buildingAPI = {
  getAll: () => api.get('/buildings'),
  getById: (id) => api.get(`/buildings/${id}`),
  getAvailableUnits: (buildingId) => api.get(`/buildings/${buildingId}/available-units`),
  checkAvailability: (data) => api.post('/buildings/check-availability', data),
  occupyUnit: (data) => api.post('/buildings/occupy-unit', data),
  releaseUnit: (data) => api.post('/buildings/release-unit', data),
};

export default api;
