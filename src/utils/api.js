import { auth } from './auth';

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
const AUDIT_SERVICE = import.meta.env.VITE_AUDIT_SERVICE_URL || "http://localhost:8002";
const TARGET_SYSTEMS_SERVICE = import.meta.env.VITE_TARGET_SYSTEMS_URL || "http://localhost:8000";
const LLM_RUNTIME_SERVICE = import.meta.env.VITE_LLM_RUNTIME_URL || "http://localhost:8000";

// Helper function to make authenticated requests to different services
const fetchWithAuthToService = async (serviceUrl, endpoint, options = {}) => {
  const authHeader = auth.getAuthHeader();
  
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    ...authHeader,
    ...options.headers
  };
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(`${serviceUrl}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    auth.logout();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
};

export const api = {
  // Make authenticated API request to main backend
  fetchWithAuth: async (url, options = {}) => {
    return fetchWithAuthToService(API_BASE, url, options);
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

  
  // Health check
  healthCheck: async () => {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  },

  // ============================================================
  // LLM RUNTIME ENDPOINTS (Port 8002)
  // ============================================================
  llmRuntime: {
    listAgents: async () => {
      const response = await fetchWithAuthToService(LLM_RUNTIME_SERVICE, '/api/v1/agents', {
        method: 'GET'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to fetch agents');
      }

      return await response.json();
    },

    createAgent: async (data) => {
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

    getAgent: async (id) => {
      const response = await fetchWithAuthToService(LLM_RUNTIME_SERVICE, `/api/v1/agents/${id}`, {
        method: 'GET'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to fetch agent');
      }

      return await response.json();
    },

    deleteAgent: async (id) => {
      const response = await fetchWithAuthToService(LLM_RUNTIME_SERVICE, `/api/v1/agents/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to delete agent');
      }

      return await response.json();
    },

    updateAgent: async (id, data) => {
      const response = await fetchWithAuthToService(LLM_RUNTIME_SERVICE, `/api/v1/agents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to update agent');
      }

      return await response.json();
    }
  },

  // ============================================================
  // AUDIT SERVICE ENDPOINTS (Port 8004)
  // ============================================================
  audit: {
    // Count audit logs matching filters
    countLogs: async (filters = {}) => {
      const cleanFilters = {};
      if (filters.event_type) cleanFilters.event_type = filters.event_type;
      if (filters.severity) cleanFilters.severity = filters.severity;
      if (filters.user_id) cleanFilters.user_id = filters.user_id;
      if (filters.user_email) cleanFilters.user_email = filters.user_email;
      if (filters.start_date) cleanFilters.start_date = filters.start_date;
      if (filters.end_date) cleanFilters.end_date = filters.end_date;
      
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
    queryLogs: async (filters = {}) => {
      // Ensure only optional fields are sent
      const cleanFilters = {};
      if (filters.event_type) cleanFilters.event_type = filters.event_type;
      if (filters.severity) cleanFilters.severity = filters.severity;
      if (filters.user_id) cleanFilters.user_id = filters.user_id;
      if (filters.user_email) cleanFilters.user_email = filters.user_email;
      if (filters.start_date) cleanFilters.start_date = filters.start_date;
      if (filters.end_date) cleanFilters.end_date = filters.end_date;
      if (filters.limit) cleanFilters.limit = filters.limit;
      if (filters.skip) cleanFilters.skip = filters.skip;
      if (filters.sort_order) cleanFilters.sort_order = filters.sort_order;
      
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
    getStats: async (startDate, endDate) => {
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
    exportLogs: async (format = 'csv', filters = {}) => {
      const cleanFilters = {};
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
    getEventTypes: async () => {
      // Return hardcoded event types since endpoint may not exist yet
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
    list: async (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.environment) params.append('environment', filters.environment);
      if (filters.status) params.append('status', filters.status);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.skip) params.append('skip', filters.skip);
      
      const response = await fetchWithAuthToService(TARGET_SYSTEMS_SERVICE, `/api/v1/target-systems?${params}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch target systems');
      }
      
      return await response.json();
    },

    // Get single target system by ID
    get: async (id) => {
      const response = await fetchWithAuthToService(TARGET_SYSTEMS_SERVICE, `/api/v1/target-systems/${id}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch target system');
      }
      
      return await response.json();
    },

    // Create new target system
    create: async (data) => {
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
    update: async (id, data) => {
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
    delete: async (id) => {
      const response = await fetchWithAuthToService(TARGET_SYSTEMS_SERVICE, `/api/v1/target-systems/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete target system');
      }
      
      return await response.json();
    },

    // Test connection to target system
    testConnection: async (id) => {
      // Validate ID before proceeding
      if (!id || id === 'undefined' || typeof id === 'undefined') {
        throw new Error('Target system ID is required for connection testing');
      }

      // Send test request with target_system_id in the body
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
    getStats: async () => {
      const response = await fetchWithAuthToService(TARGET_SYSTEMS_SERVICE, '/api/v1/target-systems/stats/overview', {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch target systems statistics');
      }
      
      return await response.json();
    },

    // Get available target types (maps to integrations)
    getTypes: async () => {
      const response = await fetchWithAuthToService(API_BASE, '/api/v1/integrations', {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch target types');
      }
      
      const data = await response.json();
      // Return integrations as types (value and name are the same)
      return {
        types: data.integrations.map(integration => ({
          value: integration.value,
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
    list: async () => {
      const response = await fetchWithAuthToService(API_BASE, '/api/v1/integrations', {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch integrations');
      }
      
      return await response.json();
    },

    // Get specific integration
    get: async (integrationId) => {
      const response = await fetchWithAuthToService(API_BASE, `/api/v1/integrations/${integrationId}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch integration');
      }
      
      return await response.json();
    },

    // Create new integration (admin only)
    create: async (data) => {
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
    update: async (integrationId, data) => {
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
    delete: async (integrationId) => {
      const response = await fetchWithAuthToService(API_BASE, `/api/v1/integrations/${integrationId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to delete integration');
      }
      
      return await response.json();
    }
  }
};

export default api;
