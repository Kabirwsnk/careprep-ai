import axios from 'axios';
import { auth } from '../config/firebase';

const API_URL = import.meta.env.VITE_API_URL || 'https://careprep-ai-backend.onrender.com';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid, redirect to login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    verify: () => api.post('/auth/verify')
};

// Symptoms API
export const symptomsAPI = {
    add: (symptomData) => api.post('/symptoms/add', symptomData),
    list: () => api.get('/symptoms/list'),
    delete: (id) => api.delete(`/symptoms/${id}`),
    generateSummary: () => api.post('/symptoms/summary')
};

// Documents API
export const documentsAPI = {
    upload: (formData) => api.post('/documents/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }),
    list: () => api.get('/documents/list'),
    delete: (id) => api.delete(`/documents/${id}`),
    getProcessed: (id) => api.get(`/documents/${id}/processed`)
};

// AI API
export const aiAPI = {
    summarize: (documentId) => api.post('/ai/summarize', { documentId }),
    chat: (message, mode, context) => api.post('/ai/chat', { message, mode, context }),
    getSummary: () => api.get('/ai/summary')
};

// Visit Summaries API
export const visitSummariesAPI = {
    list: () => api.get('/visit-summaries/list'),
    get: (id) => api.get(`/visit-summaries/${id}`),
    getLatest: () => api.get('/visit-summaries/latest')
};

export default api;
