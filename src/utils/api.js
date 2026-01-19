import { auth } from './auth';

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export const api = {
  // Make authenticated API request
  fetchWithAuth: async (url, options = {}) => {
    const authHeader = auth.getAuthHeader();
    
    // Check if body is FormData - if so, don't set Content-Type (let browser set multipart boundary)
    const isFormData = options.body instanceof FormData;
    
    const headers = {
      ...authHeader,
      ...options.headers
    };
    
    // Only set Content-Type for non-FormData requests
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers
    });

    // If unauthorized, redirect to login
    if (response.status === 401) {
      if (url.includes('/profile') || url.includes('/chat')) {
        auth.logout();
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }
      throw new Error('Unauthorized - Please refresh and try again');
    }

    return response;
  },

  // Login API call (for failsafe admin)
  login: async (credentials) => {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Login failed');
    }

    return await response.json();
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.fetchWithAuth('/profile');
    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }
    return await response.json();
  },

  // Chat with backend
  sendChatMessage: async (message, chatHistory = {}) => {
    const response = await api.fetchWithAuth('/test/license-chat', {
      method: 'POST',
      body: JSON.stringify({ 
        message,
        chat_history: chatHistory  // Include conversation context
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    
    return await response.json();
  },

  // Health check
  healthCheck: async () => {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  }
};

export default api;
