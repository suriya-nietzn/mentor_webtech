import api, { unwrap } from './api.js';

// One small module per backend resource. Each function returns the response's `data`.

export const mentorService = {
  list: (params) => unwrap(api.get('/mentors', { params })),
  filters: () => unwrap(api.get('/mentors/filters')),
  get: (id) => unwrap(api.get(`/mentors/${id}`)),
  updateProfile: (data) => unwrap(api.put('/mentors/profile', data)),
};

export const studentService = {
  getProfile: () => unwrap(api.get('/students/profile')),
  updateProfile: (data) => unwrap(api.put('/students/profile', data)),
};

export const requestService = {
  create: (data) => unwrap(api.post('/requests', data)),
  mine: (params) => unwrap(api.get('/requests/my', { params })),
  accept: (id, mentorResponse) => unwrap(api.patch(`/requests/${id}/accept`, { mentorResponse })),
  reject: (id, mentorResponse) => unwrap(api.patch(`/requests/${id}/reject`, { mentorResponse })),
  complete: (id) => unwrap(api.patch(`/requests/${id}/complete`)),
  review: (id, data) => unwrap(api.post(`/requests/${id}/review`, data)),
};

export const sessionService = {
  create: (data) => unwrap(api.post('/sessions', data)),
  mine: () => unwrap(api.get('/sessions/my')),
  get: (id) => unwrap(api.get(`/sessions/${id}`)),
  update: (id, data) => unwrap(api.put(`/sessions/${id}`, data)),
  cancel: (id) => unwrap(api.delete(`/sessions/${id}`)),
};

export const messageService = {
  conversations: () => unwrap(api.get('/messages/conversations')),
  thread: (userId) => unwrap(api.get(`/messages/${userId}`)),
  send: (receiverId, text) => unwrap(api.post('/messages', { receiverId, text })),
};

export const dashboardService = {
  student: () => unwrap(api.get('/dashboard/student')),
  mentor: () => unwrap(api.get('/dashboard/mentor')),
};

export const adminService = {
  overview: () => unwrap(api.get('/admin/overview')),
  users: (params) => unwrap(api.get('/admin/users', { params })),
};

export const miscService = {
  stats: () => unwrap(api.get('/stats/public')),
  // Returns the full response so the caller can check for a real 201.
  contact: (data) => api.post('/contact', data),
};
