// Authentication utility functions for Auth0 token management

export const auth = {
  // Get authentication token (Auth0 access token)
  getToken: () => {
    return localStorage.getItem('authToken');
  },
  
  // Store Auth0 data after login
  storeAuth0Data: (accessToken, auth0User) => {
    try {
      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('tokenType', 'bearer');
      
      // Extract username from email (admin@vega.ai -> admin)
      const username = auth0User.email?.split('@')[0] || auth0User.nickname || 'user';
      
      // Store user info (will be enriched by backend)
      const user = {
        username: username,
        email: auth0User.email,
        role: auth0User.role || 'user', // Default role, backend will update this
        is_active: true,
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userRole', user.role);
      
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
      localStorage.setItem('authToken', loginResponse.access_token);
      localStorage.setItem('tokenType', loginResponse.token_type);
      localStorage.setItem('user', JSON.stringify(loginResponse.user));
      localStorage.setItem('userRole', loginResponse.user.role);
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
      localStorage.removeItem('tokenExpiry');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
};

export default auth;
