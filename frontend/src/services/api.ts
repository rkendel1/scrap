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

export const apiService = {
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
};