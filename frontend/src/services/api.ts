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

  // Profile management endpoints
  updateProfile: async (data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    profile_picture_url?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.patch('/api/profile', data);
    return response.data;
  },

  updatePassword: async (data: {
    current_password: string;
    new_password: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.patch('/api/profile/password', data);
    return response.data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse<any>> => {
    const response = await api.post('/api/profile/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<any>> => {
    const response = await api.post('/api/profile/reset-password', {
      token,
      new_password: newPassword,
    });
    return response.data;
  },

  getNotificationPreferences: async (): Promise<ApiResponse<{
    email_notifications: boolean;
    marketing_emails: boolean;
    billing_alerts: boolean;
    subscription_updates: boolean;
  }>> => {
    const response = await api.get('/api/profile/notifications');
    return response.data;
  },

  updateNotificationPreferences: async (preferences: {
    email_notifications: boolean;
    marketing_emails: boolean;
    billing_alerts: boolean;
    subscription_updates: boolean;
  }): Promise<ApiResponse<any>> => {
    const response = await api.patch('/api/profile/notifications', preferences);
    return response.data;
  },

  deactivateAccount: async (reason?: string): Promise<ApiResponse<any>> => {
    const response = await api.post('/api/profile/deactivate', { reason });
    return response.data;
  },

  getNotifications: async (limit?: number, offset?: number): Promise<ApiResponse<{
    notifications: Array<{
      id: number;
      event_type: string;
      title: string;
      message: string;
      read: boolean;
      created_at: string;
    }>;
  }>> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const response = await api.get(`/api/profile/notifications/events?${params.toString()}`);
    return response.data;
  },

  markNotificationAsRead: async (notificationId: number): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/api/profile/notifications/events/${notificationId}/read`);
    return response.data;
  },

  getBillingHistory: async (limit?: number, offset?: number): Promise<ApiResponse<Array<{
    id: number;
    amount: number;
    currency: string;
    status: string;
    description: string;
    date: string;
    invoice_id: string;
    plan: string;
  }>>> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const response = await api.get(`/api/subscription/billing-history?${params.toString()}`);
    return response.data;
  },

  getUpcomingBilling: async (): Promise<ApiResponse<{
    next_billing_date: string;
    amount: number | null;
    plan: string;
    status: string;
    cancel_at_period_end: boolean;
  }>> => {
    const response = await api.get('/api/subscription/upcoming-billing');
    return response.data;
  },
};