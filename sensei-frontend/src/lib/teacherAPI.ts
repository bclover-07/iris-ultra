import api from './axios';

export const teacherAPI = {
  // Dashboard
  getDashboard: () => api.get('/api/teacher/dashboard'),
  getEffectiveness: () => api.get('/api/teacher/effectiveness'),

  // Classes
  getClasses: () => api.get('/api/teacher/classes'),
  getClassDetail: (id: string) => api.get(`/api/teacher/classes/${id}`),
  getClassStudents: (id: string, params?: Record<string, any>) =>
    api.get(`/api/teacher/classes/${id}/students`, { params }),

  // Students
  getStudents: (params?: { page?: number; limit?: number; filter?: string }) =>
    api.get('/api/teacher/students', { params }),
  getStudentDetail: (id: string) => api.get(`/api/teacher/students/${id}`),

  // Upload
  uploadCSV: (formData: FormData) =>
    api.post('/api/teacher/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getUploadStatus: (uploadId: string) => api.get(`/api/teacher/upload/${uploadId}/status`),

  // Interventions
  getInterventions: (params?: Record<string, any>) =>
    api.get('/api/teacher/interventions', { params }),
  createIntervention: (data: any) => api.post('/api/teacher/interventions', data),
  updateOutcome: (id: string, outcome: string) =>
    api.patch(`/api/teacher/interventions/${id}/outcome`, { outcome }),

  // Help queue
  getHelpQueue: () => api.get('/api/teacher/help-queue'),
  respondToTicket: (ticketId: string, response: string) =>
    api.post(`/api/teacher/help-queue/${ticketId}/respond`, { response }),

  // Polls
  getPolls: () => api.get('/api/teacher/polls'),
  createPoll: (data: any) => api.post('/api/teacher/polls', data),
  closePoll: (id: string) => api.patch(`/api/teacher/polls/${id}/close`),
  getPollResults: (id: string) => api.get(`/api/teacher/polls/${id}/results`),

  // Content AI
  generateContent: (data: any) => api.post('/api/teacher/content-ai/generate', data),

  // Alerts
  draftAlert: (studentId: string) =>
    api.get(`/api/teacher/alerts/draft?studentId=${studentId}`),
  sendAlert: (data: any) => api.post('/api/teacher/alerts/send', data),

  // Exams
  getExams: (classId: string) => api.get(`/api/exams/class/${classId}`),
  scheduleExams: (data: any) => api.post('/api/teacher/exams/schedule', data),
  publishExams: (examId: string) => api.patch(`/api/teacher/exams/${examId}/publish`),

  // Profile
  getProfile: () => api.get('/api/auth/me'),
  updateProfile: (data: any) => api.patch('/api/teacher/profile', data),
};
