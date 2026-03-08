import { auth } from './auth';

// In Docker: requests to /api/* and /audit/* are proxied by nginx to the
// backend services on the internal Docker network — no host/port needed.
// VITE_BACKEND_URL should be left empty ("") in Docker deployments so that
// API calls are relative (same origin → nginx proxy picks them up).
// For local dev outside Docker, set VITE_BACKEND_URL=http://localhost:8000.
const API_BASE = import.meta.env.VITE_BACKEND_URL || "";
const AUDIT_SERVICE = import.meta.env.VITE_AUDIT_SERVICE_URL || "";
const TARGET_SYSTEMS_SERVICE = import.meta.env.VITE_TARGET_SYSTEMS_URL || "";
const LLM_RUNTIME_SERVICE = import.meta.env.VITE_LLM_RUNTIME_URL || "";

interface FetchOptions extends RequestInit {
  body?: any;
  headers?: Record<string, string>;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface UserDetails {
  email: string;
  name?: string;
  [key: string]: any;
}

interface AuditFilters {
  event_type?: string;
  severity?: string;
  user_id?: string;
  user_email?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  skip?: number;
  sort_order?: string;
}

interface TargetSystemFilters {
  type?: string;
  environment?: string;
  status?: string;
  limit?: number;
  skip?: number;
}

// Helper function to make authenticated requests to different services
const fetchWithAuthToService = async (
  serviceUrl: string,
  endpoint: string,
  options: FetchOptions = {}
): Promise<Response> => {
  // Use getAuthHeaders() instead of getAuthHeader() for consistency
  const authHeaders = auth.getAuthHeaders();
  
  const isFormData = options.body instanceof FormData;
  
  const headers: Record<string, string> = {
    ...authHeaders,
    ...options.headers
  };
  
  // Don't override Content-Type if it's FormData or already set
  if (isFormData && headers['Content-Type']) {
    delete headers['Content-Type'];
  }
  
  const response = await fetch(`${serviceUrl}${endpoint}`, {
    ...options,
    headers
  });

  // Handle unauthorized access
  if (response.status === 401) {
    console.warn('⚠️ 401 received, token may be expired');
    // auth.logout();
    // window.location.href = '/login';
    throw new Error('Unauthorized - Please login again');
  }

  return response;
};

export const api = {
  // Make authenticated API request to main backend
  fetchWithAuth: async (url: string, options: FetchOptions = {}): Promise<Response> => {
    return fetchWithAuthToService(API_BASE, url, options);
  },

  // Login API call (for failsafe admin)
  login: async (credentials: LoginCredentials): Promise<any> => {
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

  // Native login API call (username/password authentication)
  nativeLogin: async (credentials: LoginCredentials): Promise<any> => {
    const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Invalid username or password');
    }

    return await response.json();
  },

  // Post-login endpoint - Called after Auth0 authentication (Legacy)
  postLogin: async (userDetails: UserDetails, accessToken: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/api/v1/auth/login-auth0`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(userDetails)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Post-login failed');
    }

    return await response.json();
  },

  // Logout endpoint - Called before clearing local data (Legacy for Auth0)
  logoutUser: async (userDetails: UserDetails, sessionId?: string): Promise<any> => {
    const token = auth.getToken();
    if (!token) {
      console.warn('No token available for logout endpoint');
      return;
    }

    try {
      const url = new URL(`${API_BASE}/api/v1/logout`);
      if (sessionId) {
        url.searchParams.append('user_session_id', sessionId);
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.warn('Logout endpoint returned non-OK status');
      }

      return await response.json().catch(() => ({}));
    } catch (error) {
      console.error('Error calling logout endpoint:', error);
      // Don't throw - we still want to complete local logout
    }
  },

  // Native logout endpoint - Called before clearing local data
  nativeLogout: async (): Promise<any> => {
    const token = auth.getToken();
    if (!token) {
      console.warn('No token available for native logout endpoint');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.warn('Native logout endpoint returned non-OK status');
      }

      return await response.json().catch(() => ({}));
    } catch (error) {
      console.error('Error calling native logout endpoint:', error);
      // Don't throw - we still want to complete local logout
    }
  },

  // Get current user profile
  getProfile: async (): Promise<any> => {
    const response = await api.fetchWithAuth('/profile');
    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }
    return await response.json();
  },

  // Chat with backend
  sendChatMessage: async (message: string, chatHistory: Record<string, any> = {}): Promise<any> => {
    const response = await api.fetchWithAuth('/test/license-chat', {
      method: 'POST',
      body: JSON.stringify({ 
        message,
        chat_history: chatHistory
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    
    return await response.json();
  },

  // Health check (no auth required)
  healthCheck: async (): Promise<boolean> => {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  },

  // ============================================================
  // LLM RUNTIME ENDPOINTS (Port 8002)
  // ============================================================
  llmRuntime: {
    listAgents: async (): Promise<any> => {
      const response = await fetchWithAuthToService(LLM_RUNTIME_SERVICE, '/api/v1/agents', {
        method: 'GET'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to fetch agents');
      }

      return await response.json();
    },

    createAgent: async (data: any): Promise<any> => {
      const response = await fetchWithAuthToService(LLM_RUNTIME_SERVICE, '/api/v1/agents', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to create agent');
      }

      return await response.json();
    },

    getAgent: async (id: string): Promise<any> => {
      const response = await fetchWithAuthToService(LLM_RUNTIME_SERVICE, `/api/v1/agents/${id}`, {
        method: 'GET'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to fetch agent');
      }

      return await response.json();
    },

    deleteAgent: async (id: string): Promise<any> => {
      const response = await fetchWithAuthToService(LLM_RUNTIME_SERVICE, `/api/v1/agents/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to delete agent');
      }

      return await response.json();
    },

    updateAgent: async (id: string, data: any): Promise<any> => {
      const response = await fetchWithAuthToService(LLM_RUNTIME_SERVICE, `/api/v1/agents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to update agent');
      }

      return await response.json();
    },

    // NEW METHOD - Activate Kill Switch
    activateKillswitch: async (id: string, data: { reason: string }): Promise<any> => {
      const response = await fetchWithAuthToService(
        LLM_RUNTIME_SERVICE, 
        `/api/v1/agents/${id}/killswitch`, 
        {
          method: 'POST',
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to activate killswitch');
      }

      return await response.json();
    }
  },

  // ============================================================
  // AUDIT SERVICE ENDPOINTS (Port 8004)
  // ============================================================
  audit: {
    // Count audit logs matching filters
    countLogs: async (filters: AuditFilters = {}): Promise<any> => {
      const cleanFilters: Partial<AuditFilters> = {};
      if (filters.event_type) cleanFilters.event_type = filters.event_type;
      if (filters.severity) cleanFilters.severity = filters.severity;
      if (filters.user_id) cleanFilters.user_id = filters.user_id;
      if (filters.user_email) cleanFilters.user_email = filters.user_email;
      if (filters.start_date) cleanFilters.start_date = filters.start_date;
      if (filters.end_date) cleanFilters.end_date = filters.end_date;
      
      console.log('[API] countLogs - sending filters to backend:', cleanFilters);
      
      const response = await fetchWithAuthToService(AUDIT_SERVICE, '/api/v1/audit-logs/count', {
        method: 'POST',
        body: JSON.stringify(cleanFilters)
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to count audit logs');
      }
      
      return await response.json();
    },

    // Query audit logs with filters, pagination, and sorting
    queryLogs: async (filters: AuditFilters = {}): Promise<any> => {
      const cleanFilters: Partial<AuditFilters> = {};
      if (filters.event_type) cleanFilters.event_type = filters.event_type;
      if (filters.severity) cleanFilters.severity = filters.severity;
      if (filters.user_id) cleanFilters.user_id = filters.user_id;
      if (filters.user_email) cleanFilters.user_email = filters.user_email;
      if (filters.start_date) cleanFilters.start_date = filters.start_date;
      if (filters.end_date) cleanFilters.end_date = filters.end_date;
      if (filters.limit) cleanFilters.limit = filters.limit;
      if (filters.skip) cleanFilters.skip = filters.skip;
      if (filters.sort_order) cleanFilters.sort_order = filters.sort_order;
      
      console.log('[API] queryLogs - sending filters to backend:', cleanFilters);
      
      const response = await fetchWithAuthToService(AUDIT_SERVICE, '/api/v1/audit-logs/query', {
        method: 'POST',
        body: JSON.stringify(cleanFilters)
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to query audit logs');
      }
      
      return await response.json();
    },

    // Get audit statistics
    getStats: async (startDate?: string, endDate?: string): Promise<any> => {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await fetchWithAuthToService(AUDIT_SERVICE, `/api/v1/audit-logs/stats?${params}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        // Return default stats if service fails
        return {
          total_events: 0,
          events_by_type: {},
          events_by_severity: {},
          events_by_user: {},
          events_by_agent: {},
          time_range: {}
        };
      }
      
      return await response.json();
    },

    // Export audit logs
    exportLogs: async (format: string = 'csv', filters: AuditFilters = {}): Promise<Blob> => {
      const cleanFilters: Partial<AuditFilters> = {};
      if (filters.event_type) cleanFilters.event_type = filters.event_type;
      if (filters.severity) cleanFilters.severity = filters.severity;
      if (filters.user_email) cleanFilters.user_email = filters.user_email;
      if (filters.user_id) cleanFilters.user_id = filters.user_id;
      if (filters.start_date) cleanFilters.start_date = filters.start_date;
      if (filters.end_date) cleanFilters.end_date = filters.end_date;
      if (filters.limit) cleanFilters.limit = filters.limit;
      if (filters.skip) cleanFilters.skip = filters.skip;
      if (filters.sort_order) cleanFilters.sort_order = filters.sort_order;
      
      const response = await fetchWithAuthToService(AUDIT_SERVICE, `/api/v1/audit-logs/export?format=${format}`, {
        method: 'POST',
        body: JSON.stringify(cleanFilters)
      });
      
      if (!response.ok) {
        throw new Error('Failed to export audit logs');
      }
      
      return await response.blob();
    },

    // Get event types available
    getEventTypes: async (): Promise<{ event_types: string[] }> => {
      return {
        event_types: [
          'agent_created',
          'agent_updated',
          'agent_deleted',
          'agent_started',
          'agent_stopped',
          'chat_started',
          'chat_message',
          'chat_response',
          'chat_error',
          'target_created',
          'target_updated',
          'target_deleted',
          'target_connection_success',
          'target_connection_failed',
          'user_login',
          'user_logout',
          'auth_failed',
          'system_startup',
          'system_shutdown',
          'system_error'
        ]
      };
    }
  },

  // ============================================================
  // TARGET SYSTEMS SERVICE ENDPOINTS (Port 8005)
  // ============================================================
  targetSystems: {
    // List target systems with filters
    list: async (filters: TargetSystemFilters = {}): Promise<any> => {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.environment) params.append('environment', filters.environment);
      if (filters.status) params.append('status', filters.status);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.skip) params.append('skip', filters.skip.toString());
      
      const response = await fetchWithAuthToService(TARGET_SYSTEMS_SERVICE, `/api/v1/target-systems?${params}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch target systems');
      }
      
      return await response.json();
    },

    // Get single target system by ID
    get: async (id: string): Promise<any> => {
      const response = await fetchWithAuthToService(TARGET_SYSTEMS_SERVICE, `/api/v1/target-systems/${id}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch target system');
      }
      
      return await response.json();
    },

    // Create new target system
    create: async (data: any): Promise<any> => {
      const response = await fetchWithAuthToService(TARGET_SYSTEMS_SERVICE, '/api/v1/target-systems', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to create target system');
      }
      
      return await response.json();
    },

    // Update target system
    update: async (id: string, data: any): Promise<any> => {
      const response = await fetchWithAuthToService(TARGET_SYSTEMS_SERVICE, `/api/v1/target-systems/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to update target system');
      }
      
      return await response.json();
    },

    // Delete target system
    delete: async (id: string): Promise<any> => {
      const response = await fetchWithAuthToService(TARGET_SYSTEMS_SERVICE, `/api/v1/target-systems/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete target system');
      }
      
      return await response.json();
    },

    // Test connection to target system
    testConnection: async (id: string): Promise<any> => {
      if (!id || id === 'undefined' || typeof id === 'undefined') {
        throw new Error('Target system ID is required for connection testing');
      }

      const testUrl = '/api/v1/target-systems/test-connection';
      console.log('[testConnection] Sending test request for ID:', id);
      
      const response = await fetchWithAuthToService(TARGET_SYSTEMS_SERVICE, testUrl, {
        method: 'POST',
        body: JSON.stringify({ target_system_id: id })
      });
      
      console.log('[testConnection] Test response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('[testConnection] Test failed with error:', error);
        throw new Error(error.detail || 'Connection test failed');
      }
      
      const result = await response.json();
      console.log('[testConnection] Test result:', result);
      return result;
    },

    // Get target systems statistics
    getStats: async (): Promise<any> => {
      const response = await fetchWithAuthToService(TARGET_SYSTEMS_SERVICE, '/api/v1/target-systems/stats/overview', {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch target systems statistics');
      }
      
      return await response.json();
    },

    // Get available target types (maps to integrations)
    getTypes: async (): Promise<any> => {
      const response = await fetchWithAuthToService(API_BASE, '/api/v1/integrations', {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch target types');
      }
      
      const data = await response.json();
      
      // Convert snake_case to PascalCase for consistency with form expectations
      const snakeToPascal = (str: string): string => {
        return str
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join('');
      };
      
      return {
        types: data.integrations.map((integration: any) => ({
          value: snakeToPascal(integration.value),  // Convert to PascalCase
          name: integration.name,
          description: integration.description
        }))
      };
    }
  },

  // ============================================================
  // INTEGRATIONS ENDPOINTS
  // ============================================================
  integrations: {
    // Get all integrations
    list: async (): Promise<any> => {
      const response = await fetchWithAuthToService(API_BASE, '/api/v1/integrations', {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch integrations');
      }
      
      return await response.json();
    },

    // Get specific integration
    get: async (integrationId: string): Promise<any> => {
      const response = await fetchWithAuthToService(API_BASE, `/api/v1/integrations/${integrationId}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch integration');
      }
      
      return await response.json();
    },

    // Create new integration (admin only)
    create: async (data: any): Promise<any> => {
      const response = await fetchWithAuthToService(API_BASE, '/api/v1/integrations', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to create integration');
      }
      
      return await response.json();
    },

    // Update integration (admin only)
    update: async (integrationId: string, data: any): Promise<any> => {
      const response = await fetchWithAuthToService(API_BASE, `/api/v1/integrations/${integrationId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to update integration');
      }
      
      return await response.json();
    },

    // Delete integration (admin only)
    delete: async (integrationId: string): Promise<any> => {
      const response = await fetchWithAuthToService(API_BASE, `/api/v1/integrations/${integrationId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to delete integration');
      }
      
      return await response.json();
    }
  },

  // User management endpoints
  users: {
    // List all users (admin only - requires MANAGE_USERS permission)
    list: async (skip: number = 0, limit: number = 100): Promise<any> => {
      const response = await fetchWithAuthToService(API_BASE, `/api/v1/users?skip=${skip}&limit=${limit}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to fetch users');
      }
      
      return await response.json();
    },

    // Get specific user details
    get: async (userId: string): Promise<any> => {
      const response = await fetchWithAuthToService(API_BASE, `/api/v1/users/${userId}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to fetch user');
      }
      
      return await response.json();
    },

    // Create new user (admin only)
    create: async (userData: any): Promise<any> => {
      const response = await fetchWithAuthToService(API_BASE, '/api/v1/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to create user');
      }
      
      return await response.json();
    },

    // Update user (admin only)
    update: async (userId: string, userData: any): Promise<any> => {
      const response = await fetchWithAuthToService(API_BASE, `/api/v1/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to update user');
      }
      
      return await response.json();
    },

    // Delete user (admin only)
    delete: async (userId: string): Promise<any> => {
      const response = await fetchWithAuthToService(API_BASE, `/api/v1/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const errorMsg = error.detail || 'Failed to delete user';
        const err = new Error(errorMsg) as any;
        err.status = response.status;
        throw err;
      }
      
      return await response.json();
    }
  }
};

export default api;