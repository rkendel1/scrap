import axios from 'axios';
import { FormRecord, ExtractRequest, ApiResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for extraction which can take time
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  // Set authentication header
  setAuthToken: (token: string) => {
    localStorage.setItem('authToken', token);
  },

  // Clear authentication
  clearAuth: () => {
    localStorage.removeItem('authToken');
  },

  // Generic request methods
  get: async (url: string): Promise<any> => {
    const response = await api.get(url);
    return response.data;
  },

  post: async (url: string, data?: any): Promise<any> => {
    const response = await api.post(url, data);
    return response.data;
  },

  put: async (url: string, data?: any): Promise<any> => {
    const response = await api.put(url, data);
    return response.data;
  },

  delete: async (url: string): Promise<any> => {
    const response = await api.delete(url);
    return response.data;
  },

  // Extract website data
  extractWebsite: async (data: ExtractRequest): Promise<ApiResponse<FormRecord>> => {
    const response = await api.post('/api/extract', data);
    return response.data;
  },

  // Get all records
  getAllRecords: async (): Promise<ApiResponse<FormRecord[]>> => {
    const response = await api.get('/api/records');
    return response.data;
  },

  // Get single record
  getRecord: async (id: number): Promise<ApiResponse<FormRecord>> => {
    const response = await api.get(`/api/records/${id}`);
    return response.data;
  },

  // Delete record
  deleteRecord: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/api/records/${id}`);
    return response.data;
  },

  // Search records
  searchRecords: async (query: string): Promise<ApiResponse<FormRecord[]>> => {
    const response = await api.get(`/api/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<any> => {
    const response = await api.get('/health');
    return response.data;
  },

  // Subscription endpoints
  getSubscriptionPlans: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/api/subscription/plans');
    return response.data;
  },

  getCurrentSubscription: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/api/subscription/current');
    return response.data;
  },

  createCheckoutSession: async (planId: string): Promise<ApiResponse<{ checkoutUrl: string }>> => {
    const response = await api.post('/api/subscription/checkout', { planId });
    return response.data;
  },

  createBillingPortalSession: async (): Promise<ApiResponse<{ portalUrl: string }>> => {
    const response = await api.post('/api/subscription/billing-portal');
    return response.data;
  },
};