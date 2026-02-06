// Authentication utility functions for Auth0 token management

const ROLE_CLAIM = 'https://vega.ai/roles';

const normalizeRoles = (roles) => {
  if (!roles) return [];
  if (typeof roles === 'string') return [roles.trim().toLowerCase()].filter(Boolean);
  if (Array.isArray(roles)) return roles.map(r => (r || '').toString().trim().toLowerCase()).filter(Boolean);
  return [];
};

const decodePayload = (token) => {
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

const extractRolesFromToken = (token) => {
  const payload = decodePayload(token);
  if (!payload) return [];
  const claim = payload[ROLE_CLAIM] || payload.roles || payload.permissions || [];
  return normalizeRoles(claim);
};

// Check if token is expired
const isTokenExpired = (token) => {
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
  getToken: () => {
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
  storeAuth0Data: (accessToken, auth0User) => {
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
      const user = {
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

  // Get token type (usually 'Bearer')
  getTokenType: () => {
    return localStorage.getItem('tokenType') || 'bearer';
  },

  // Get current user info
  getCurrentUser: () => {
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
  isAuthenticated: () => {
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
  isAdmin: () => {
    try {
      const user = auth.getCurrentUser();
      return user?.role === 'admin' || user?.roles?.includes('admin');
    } catch (error) {
      console.error('❌ Failed to check admin status:', error);
      return false;
    }
  },

  // Check if user has specific role
  hasRole: (roleName) => {
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
  getAuthHeader: () => {
    const token = auth.getToken();
    const tokenType = auth.getTokenType();
    
    if (!token) return {};
    
    return {
      'Authorization': `${tokenType} ${token}`
    };
  },

  // Get all auth headers for API calls
  getAuthHeaders: () => {
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
  storeLoginData: (loginResponse) => {
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
  logout: () => {
    try {
      console.log('🚪 Clearing auth data from localStorage');
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenType');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userRoles');
      localStorage.removeItem('tokenExpiry');
      console.log('✅ Auth data cleared successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
    }
  },

  // Refresh token (placeholder for future implementation)
  refreshToken: async () => {
    // This would integrate with Auth0's refresh token flow
    // For now, we rely on Auth0Provider's built-in token refresh
    console.log('⚠️ Token refresh should be handled by Auth0Provider');
    return null;
  },

  // Debug: Print current auth state
  debugAuthState: () => {
    console.log('='.repeat(80));
    console.log('🔍 AUTH DEBUG STATE');
    console.log('='.repeat(80));
    console.log('Token exists:', !!auth.getToken());
    console.log('Token:', auth.getToken()?.substring(0, 50) + '...');
    console.log('User:', auth.getCurrentUser());
    console.log('Is Authenticated:', auth.isAuthenticated());
    console.log('Is Admin:', auth.isAdmin());
    console.log('Token Expiry:', localStorage.getItem('tokenExpiry'));
    console.log('='.repeat(80));
  }
};

export default auth;  