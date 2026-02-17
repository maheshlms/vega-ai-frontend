// auth.ts - Authentication utility functions for Auth0 token management

const ROLE_CLAIM = 'https://vega.ai/roles';

interface User {
  username: string;
  email: string;
  name?: string;
  picture?: string;
  sub: string;
  role: string;
  roles: string[];
  is_active: boolean;
  [key: string]: any;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  user?: any;
}

interface SessionData {
  session_id?: string;
  roles?: string[] | string;
  [key: string]: any;
}

interface TokenPayload {
  exp?: number;
  [key: string]: any;
}

const normalizeRoles = (roles: string[] | string | null | undefined): string[] => {
  if (!roles) return [];
  if (typeof roles === 'string') return [roles.trim().toLowerCase()].filter(Boolean);
  if (Array.isArray(roles)) return roles.map(r => (r || '').toString().trim().toLowerCase()).filter(Boolean);
  return [];
};

const decodePayload = (token: string | null): TokenPayload | null => {
  try {
    const parts = token?.split?.('.');
    if (!parts || parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  } catch (e) {
    console.warn('Failed to decode token payload', e);
    return null;
  }
};

const extractRolesFromToken = (token: string): string[] => {
  const payload = decodePayload(token);
  if (!payload) return [];
  const claim = payload[ROLE_CLAIM] || payload.roles || payload.permissions || [];
  return normalizeRoles(claim);
};

// Check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = decodePayload(token);
    if (!payload || !payload.exp) return true;
    
    // exp is in seconds, Date.now() is in milliseconds
    const expiryTime = payload.exp * 1000;
    const currentTime = Date.now();
    
    // Add 5 minute buffer before actual expiry
    const bufferTime = 5 * 60 * 1000;
    
    return currentTime >= (expiryTime - bufferTime);
  } catch (e) {
    console.warn('Failed to check token expiry', e);
    return true;
  }
};

export const auth = {
  // Get authentication token (Auth0 access token)
  getToken: (): string | null => {
    const token = localStorage.getItem('authToken');
    
    // Check if token exists and is not expired
    if (token && isTokenExpired(token)) {
      console.warn('⚠️ Token expired, clearing auth data');
      auth.logout();
      return null;
    }
    
    return token;
  },
  
  // Store Auth0 data after login
  storeAuth0Data: (accessToken: string, auth0User: any): void => {
    try {
      console.log('🔐 [AUTH UTIL] Storing Auth0 token in localStorage');
      console.log('✅ Token stored successfully');
      
      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('tokenType', 'bearer');
      
      // Extract username from email (admin@vega.ai -> admin)
      const username = auth0User.email?.split('@')[0] || auth0User.nickname || auth0User.sub || 'user';

      // Roles from token (namespaced claim) or fallback to auth0User
      const rolesFromToken = extractRolesFromToken(accessToken);
      const rolesFromProfile = normalizeRoles(auth0User?.[ROLE_CLAIM] || auth0User?.roles || auth0User?.permissions);
      const allRoles = [...new Set([...rolesFromToken, ...rolesFromProfile])];
      
      // If no roles found, default to 'user'
      if (allRoles.length === 0) {
        allRoles.push('user');
      }
      
      const role = allRoles.includes('admin') ? 'admin' : 'user';
      
      // Store user info including roles array
      const user: User = {
        username: username,
        email: auth0User.email,
        name: auth0User.name,
        picture: auth0User.picture,
        sub: auth0User.sub,
        role: role,
        roles: allRoles,
        is_active: true,
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userRoles', JSON.stringify(allRoles));
      
      // Get expiry from token itself (more accurate)
      const payload = decodePayload(accessToken);
      if (payload && payload.exp) {
        const expiryDate = new Date(payload.exp * 1000);
        localStorage.setItem('tokenExpiry', expiryDate.toISOString());
        console.log('📅 Token expires at:', expiryDate.toLocaleString());
      } else {
        // Fallback: Auth0 tokens typically expire in 24 hours
        const expiryDate = new Date(Date.now() + (24 * 60 * 60 * 1000));
        localStorage.setItem('tokenExpiry', expiryDate.toISOString());
      }
      
      console.log('👤 User stored:', username, '| Role:', role, '| All Roles:', allRoles);
    } catch (error) {
      console.error('❌ Failed to store Auth0 data:', error);
      throw new Error('Failed to store authentication data');
    }
  },

  // Store session data received from backend
  storeSessionData: (sessionData: SessionData): void => {
    try {
      if (sessionData && sessionData.session_id) {
        localStorage.setItem('sessionId', sessionData.session_id);
        console.log('💾 Session ID stored:', sessionData.session_id);
      }
      
      // Update roles if provided by backend
      if (sessionData && sessionData.roles) {
        const normalizedRoles = normalizeRoles(sessionData.roles);
        localStorage.setItem('userRoles', JSON.stringify(normalizedRoles));
        
        // Update user object with new roles
        const user = auth.getCurrentUser();
        if (user) {
          user.roles = normalizedRoles;
          user.role = normalizedRoles.includes('admin') ? 'admin' : 'user';
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('userRole', user.role);
          console.log('👤 Roles updated from session:', normalizedRoles);
        }
      }
    } catch (error) {
      console.error('❌ Failed to store session data:', error);
    }
  },

  // Get session ID
  getSessionId: (): string | null => {
    return localStorage.getItem('sessionId');
  },

  // Get token type (usually 'Bearer')
  getTokenType: (): string => {
    return localStorage.getItem('tokenType') || 'bearer';
  },

  // Get current user info
  getCurrentUser: (): User | null => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      
      const user = JSON.parse(userStr);
      
      // Validate user object structure
      if (!user || typeof user !== 'object' || !user.username || !user.role) {
        console.warn('⚠️ Invalid user data found, clearing localStorage');
        auth.logout();
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('❌ Failed to parse user data:', error);
      auth.logout();
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    try {
      const token = auth.getToken(); // This already checks expiry
      const user = auth.getCurrentUser();
      
      if (!token || !user) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      auth.logout();
      return false;
    }
  },

  // Check if user is admin
  isAdmin: (): boolean => {
    try {
      const user = auth.getCurrentUser();
      
      // Check 1: Direct admin role
      if (user?.role === 'admin' || user?.roles?.includes('admin')) {
        return true;
      }
      
      // Check 2: Email contains 'admin'
      if (user?.email && user.email.toLowerCase().includes('admin')) {
        return true;
      }
      
      // Check 3: Has admin-level permissions (delete or create permissions)
      const roles = user?.roles || [];
      const hasAdminPermissions = roles.some(role => 
        role.includes('delete:') || 
        role.includes('create:') ||
        role === 'admin'
      );
      
      return hasAdminPermissions;
    } catch (error) {
      console.error('❌ Failed to check admin status:', error);
      return false;
    }
  },

  // Check if user has specific role
  hasRole: (roleName: string): boolean => {
    try {
      const user = auth.getCurrentUser();
      const roles = user?.roles || [];
      return roles.includes(roleName.toLowerCase());
    } catch (error) {
      console.error('❌ Failed to check role:', error);
      return false;
    }
  },

  // Get authorization header
  getAuthHeader: (): Record<string, string> => {
    const token = auth.getToken();
    const tokenType = auth.getTokenType();
    
    if (!token) return {};
    
    return {
      'Authorization': `${tokenType} ${token}`
    };
  },

  // Get all auth headers for API calls
  getAuthHeaders: (): Record<string, string> => {
    const token = auth.getToken();
    const tokenType = auth.getTokenType();
    
    if (!token) {
      return {
        'Content-Type': 'application/json'
      };
    }
    
    return {
      'Authorization': `${tokenType} ${token}`,
      'Content-Type': 'application/json'
    };
  },

  // Store login data (for local fallback admin)
  storeLoginData: (loginResponse: LoginResponse): void => {
    try {
      const rolesFromToken = extractRolesFromToken(loginResponse.access_token);
      const rolesFromProfile = normalizeRoles(loginResponse.user?.[ROLE_CLAIM] || loginResponse.user?.roles || loginResponse.user?.permissions);
      const allRoles = [...new Set([...rolesFromToken, ...rolesFromProfile])];
      
      // If no roles found, default to 'user'
      if (allRoles.length === 0) {
        allRoles.push('user');
      }
      
      const role = allRoles.includes('admin') ? 'admin' : (loginResponse.user?.role || 'user');

      localStorage.setItem('authToken', loginResponse.access_token);
      localStorage.setItem('tokenType', loginResponse.token_type);
      
      const userPayload = { 
        ...(loginResponse.user || {}), 
        role, 
        roles: allRoles,
        is_active: true
      };
      
      localStorage.setItem('user', JSON.stringify(userPayload));
      localStorage.setItem('userRole', role);
      localStorage.setItem('userRoles', JSON.stringify(allRoles));
      
      // Use token expiry if available
      const expiresIn = loginResponse.expires_in || (24 * 60 * 60); // Default 24 hours
      localStorage.setItem('tokenExpiry', new Date(Date.now() + (expiresIn * 1000)).toISOString());
      
      console.log('✅ Login data stored successfully');
    } catch (error) {
      console.error('❌ Failed to store login data:', error);
      throw new Error('Failed to store authentication data');
    }
  },

  // Logout user
  logout: (): void => {
    try {
      console.log('🚪 Clearing auth data from localStorage');
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenType');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userRoles');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('sessionId');
      console.log('✅ Auth data cleared successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
    }
  },

  // Refresh token (placeholder for future implementation)
  refreshToken: async (): Promise<null> => {
    // This would integrate with Auth0's refresh token flow
    // For now, we rely on Auth0Provider's built-in token refresh
    console.log('⚠️ Token refresh should be handled by Auth0Provider');
    return null;
  },

  // Debug: Print current auth state
  debugAuthState: (): void => {
    console.log('='.repeat(80));
    console.log('🔍 AUTH DEBUG STATE');
    console.log('='.repeat(80));
    console.log('Token exists:', !!auth.getToken());
    console.log('Token:', auth.getToken()?.substring(0, 50) + '...');
    console.log('User:', auth.getCurrentUser());
    console.log('Is Authenticated:', auth.isAuthenticated());
    console.log('Is Admin:', auth.isAdmin());
    console.log('Token Expiry:', localStorage.getItem('tokenExpiry'));
    console.log('Session ID:', auth.getSessionId());
    console.log('='.repeat(80));
  }
};

export default auth;