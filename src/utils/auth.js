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

export const auth = {
  // Get authentication token (Auth0 access token)
  getToken: () => {
    return localStorage.getItem('authToken');
  },
  
  // Store Auth0 data after login
  storeAuth0Data: (accessToken, auth0User) => {
    try {
      // console.log('🔐 [AUTH UTIL] Storing Auth0 token in localStorage');
      // console.log('Token:', accessToken);
      
      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('tokenType', 'bearer');
      
      // Extract username from email (admin@vega.ai -> admin)
      const username = auth0User.email?.split('@')[0] || auth0User.nickname || 'user';

      // Roles from token (namespaced claim) or fallback to auth0User
      const rolesFromToken = extractRolesFromToken(accessToken);
      const rolesFromProfile = normalizeRoles(auth0User?.[ROLE_CLAIM] || auth0User?.roles || auth0User?.permissions);
      const allRoles = [...new Set([...rolesFromToken, ...rolesFromProfile])];
      const role = allRoles.includes('admin') ? 'admin' : (auth0User.role || 'user');
      
      // Store user info including roles array
      const user = {
        username: username,
        email: auth0User.email,
        role: role,
        roles: allRoles,  // Store the full roles array with permissions
        is_active: true,
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userRoles', JSON.stringify(allRoles));
      
      // Auth0 tokens typically expire in 24 hours, but we'll refresh as needed
      const expiryDate = new Date(Date.now() + (24 * 60 * 60 * 1000));
      localStorage.setItem('tokenExpiry', expiryDate.toISOString());
    } catch (error) {
      console.error('Failed to store Auth0 data:', error);
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
        console.warn('Invalid user data found, clearing localStorage');
        auth.logout();
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Failed to parse user data:', error);
      auth.logout();
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    try {
      const token = auth.getToken();
      const expiry = localStorage.getItem('tokenExpiry');
      
      if (!token || !expiry) {
        return false;
      }
      
      // Check if token is expired
      const expiryDate = new Date(expiry);
      const now = new Date();
      
      // Validate expiry date
      if (isNaN(expiryDate.getTime())) {
        console.warn('Invalid expiry date, logging out');
        auth.logout();
        return false;
      }
      
      if (now >= expiryDate) {
        auth.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      auth.logout();
      return false;
    }
  },

  // Check if user is admin
  isAdmin: () => {
    try {
      const user = auth.getCurrentUser();
      return user?.role === 'admin';
    } catch (error) {
      console.error('Failed to check admin status:', error);
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

  // Store login data (for local fallback admin)
  storeLoginData: (loginResponse) => {
    try {
      const rolesFromToken = extractRolesFromToken(loginResponse.access_token);
      const rolesFromProfile = normalizeRoles(loginResponse.user?.[ROLE_CLAIM] || loginResponse.user?.roles || loginResponse.user?.permissions);
      const allRoles = [...new Set([...rolesFromToken, ...rolesFromProfile])];
      const role = allRoles.includes('admin') ? 'admin' : (loginResponse.user?.role || 'user');

      localStorage.setItem('authToken', loginResponse.access_token);
      localStorage.setItem('tokenType', loginResponse.token_type);
      const userPayload = { ...(loginResponse.user || {}), role, roles: allRoles };
      localStorage.setItem('user', JSON.stringify(userPayload));
      localStorage.setItem('userRole', role);
      localStorage.setItem('userRoles', JSON.stringify(allRoles));
      localStorage.setItem('tokenExpiry', new Date(Date.now() + (loginResponse.expires_in * 1000)).toISOString());
    } catch (error) {
      console.error('Failed to store login data:', error);
      throw new Error('Failed to store authentication data');
    }
  },

  // Logout user
  logout: () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenType');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userRoles');
      localStorage.removeItem('tokenExpiry');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
};

export default auth;
